import { DatabaseSync } from 'node:sqlite';
import { Database, Repository } from '../src/storage/repository';
import { executeOrder, newPortfolio } from '../src/domain/engine';
import { AppState, Instrument } from '../src/domain/types';

describe('real SQLite persistence', () => {
  let sql: DatabaseSync, db: Database, repo: Repository;
  let state: AppState;
  beforeEach(async () => {
    sql = new DatabaseSync(':memory:');
    db = {
      execAsync: async (query) => {
        sql.exec(query);
      },
      runAsync: async (query, ...args) => sql.prepare(query).run(...args),
      getFirstAsync: async <T>(query: string, ...args: (string | number | null)[]) =>
        (sql.prepare(query).get(...args) as T | undefined) ?? null,
    };
    repo = new Repository(db);
    await repo.initialize();
    state = {
      version: 1,
      locale: 'en',
      market: 'TW',
      portfolios: { TW: newPortfolio('TW', 'test', 'tw'), US: newPortfolio('US', 'test', 'us') },
      completedLessons: [],
      answers: {},
      bookmarks: [],
      readResources: [],
      forecasts: [],
    };
  });
  afterEach(() => sql.close());
  function bought() {
    const instrument: Instrument = {
      id: 'TW:2330',
      market: 'TW',
      currency: 'TWD',
      symbol: '2330',
      name: { en: 'TSMC', 'zh-TW': '台積電' },
      sector: { en: 'chips', 'zh-TW': '晶片' },
      seedPrice: 10000,
    };
    return {
      ...state,
      portfolios: {
        ...state.portfolios,
        TW: executeOrder(
          state.portfolios.TW,
          { id: 'order-1', instrumentId: instrument.id, quantity: 2, side: 'buy' },
          { instrument, price: 10000, date: '2024-01-02', datasetId: 'test' },
          '2024-01-02',
        ),
      },
    };
  }
  test('round-trip saves ledger and portfolio together', async () => {
    await repo.save(state, 0);
    const updated = bought();
    await repo.save(updated, 1);
    expect((await repo.load())?.state).toEqual(updated);
    expect(sql.prepare('SELECT count(*) AS n FROM trade_journal').get()?.n).toBe(1);
    await repo.save({ ...updated, locale: 'zh-TW' }, 2);
    expect(sql.prepare('SELECT count(*) AS n FROM trade_journal').get()?.n).toBe(1);
  });
  test('failure after ledger insert rolls back the entire mutation', async () => {
    await repo.save(state, 0);
    const failing = new Repository({
      ...db,
      runAsync: async (query, ...args) => {
        if (query.startsWith('INSERT INTO app_state')) throw new Error('disk full');
        return db.runAsync(query, ...args);
      },
    });
    await expect(failing.save(bought(), 1)).rejects.toThrow('disk full');
    expect((await repo.load())?.state).toEqual(state);
    expect(sql.prepare('SELECT count(*) AS n FROM trade_journal').get()?.n).toBe(0);
  });
  test('stale writer cannot overwrite another window', async () => {
    await repo.save(state, 0);
    await repo.save({ ...state, locale: 'zh-TW' }, 1);
    await expect(repo.save(bought(), 1)).rejects.toThrow('another window');
    expect((await repo.load())?.state.locale).toBe('zh-TW');
  });
  test('unreconciled state is rejected', async () => {
    await repo.save(state, 0);
    const bad = {
      ...state,
      portfolios: { ...state.portfolios, TW: { ...state.portfolios.TW, cash: 1 } },
    };
    await expect(repo.save(bad, 1)).rejects.toThrow('reconciliation');
    expect((await repo.load())?.state).toEqual(state);
  });
});

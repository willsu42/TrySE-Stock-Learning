import { DatabaseSync } from 'node:sqlite';
import { Database, Repository } from '../src/storage/repository';
import { executeOrder, newPortfolio } from '../src/domain/engine';
import { AppState, Instrument } from '../src/domain/types';
import { recordAnswer } from '../src/domain/learning';

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
  test('cannot remove a recorded trade by restoring an earlier snapshot', async () => {
    await repo.save(state, 0);
    const updated = bought();
    await repo.save(updated, 1);
    await expect(repo.save(state, 2)).rejects.toThrow('history');
    expect((await repo.load())?.state).toEqual(updated);
  });
  test('cannot rebase starting cash inside an existing replay', async () => {
    await repo.save(state, 0);
    const changed = {
      ...state,
      portfolios: { ...state.portfolios, TW: { ...state.portfolios.TW, initialCash: 1, cash: 1 } },
    };
    await expect(repo.save(changed, 1)).rejects.toThrow('settings');
  });
  test('load detects a missing journal entry without overwriting saved data', async () => {
    await repo.save(bought(), 0);
    sql.exec('DELETE FROM trade_journal');
    await expect(repo.load()).rejects.toThrow('journal');
    expect(sql.prepare('SELECT revision FROM app_state WHERE id = 1').get()?.revision).toBe(1);
  });
  test('a fresh reset preserves the old ledger and cannot reuse its session ID', async () => {
    await repo.save(bought(), 0);
    const reset = {
      ...state,
      portfolios: { ...state.portfolios, TW: newPortfolio('TW', 'test', 'fresh') },
    };
    await repo.save(reset, 1);
    expect((await repo.load())?.state.portfolios.TW.entries).toEqual([]);
    expect(sql.prepare('SELECT count(*) AS n FROM trade_journal').get()?.n).toBe(1);
    await expect(repo.save(state, 2)).rejects.toThrow('session ID');
  });
  test('newer database schemas are not silently downgraded', async () => {
    sql.exec('PRAGMA user_version = 99');
    await expect(repo.initialize()).rejects.toThrow('newer');
    expect(sql.prepare('PRAGMA user_version').get()?.user_version).toBe(99);
  });
  test('legacy snapshots gain quiz history without losing earlier answers', async () => {
    state.answers = { earlier: 2 };
    await repo.save(state, 0);
    const question = { id: 'q1', options: ['wrong', 'right'], answer: 1 };
    const first = recordAnswer(state, question, 0, 'attempt-1', '2026-09-19T10:00:00Z');
    const second = recordAnswer(first, question, 1, 'attempt-2', '2026-09-19T10:01:00Z');
    await repo.save(first, 1);
    await repo.save(second, 2);
    expect((await repo.load())?.state.answers).toEqual({ earlier: 2, q1: 1 });
    expect((await repo.load())?.state.quizAttempts?.map((attempt) => attempt.correct)).toEqual([
      false,
      true,
    ]);
    await expect(repo.save(first, 3)).rejects.toThrow('Quiz history');
    await expect(
      repo.save(
        { ...second, quizAttempts: second.quizAttempts?.map((a) => ({ ...a, correct: true })) },
        3,
      ),
    ).rejects.toThrow('Quiz history');
    expect((await repo.load())?.revision).toBe(3);
  });
  test('locked forecasts allow reveal but reject rewriting, removal, or hiding results', async () => {
    const locked: AppState = {
      ...state,
      forecasts: [
        {
          id: 'forecast-1',
          instrumentId: 'TW:2330',
          cutoff: '2025-01-02',
          target: '2025-01-03',
          horizon: 1,
          prediction: 10000,
          baseline: 9900,
          model: 9950,
          modelVersion: 'test-v1',
          datasetId: 'test',
          revealed: false,
        },
      ],
    };
    await repo.save(locked, 0);
    await expect(
      repo.save({ ...locked, forecasts: [{ ...locked.forecasts[0]!, prediction: 11000 }] }, 1),
    ).rejects.toThrow('locked forecast');
    await expect(repo.save(state, 1)).rejects.toThrow('Locked forecasts');
    const revealed = { ...locked, forecasts: [{ ...locked.forecasts[0]!, revealed: true }] };
    await repo.save(revealed, 1);
    await expect(repo.save(locked, 2)).rejects.toThrow('locked forecast');
    expect((await repo.load())?.state).toEqual(revealed);
  });
});

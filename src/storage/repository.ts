import { AppState } from '../domain/types';
import { reconcile } from '../domain/engine';

export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null>;
}
export const schema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL, payload TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS trade_journal (session_id TEXT NOT NULL, entry_id TEXT NOT NULL, instrument_id TEXT NOT NULL, kind TEXT NOT NULL, date TEXT NOT NULL, cash_delta INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(session_id, entry_id));
  CREATE TABLE IF NOT EXISTS datasets (id TEXT PRIMARY KEY, kind TEXT NOT NULL, source TEXT NOT NULL, calendar TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS instruments (id TEXT PRIMARY KEY, symbol TEXT NOT NULL, market TEXT NOT NULL, currency TEXT NOT NULL, payload TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS daily_prices (dataset_id TEXT NOT NULL REFERENCES datasets(id), instrument_id TEXT NOT NULL REFERENCES instruments(id), date TEXT NOT NULL, open INTEGER NOT NULL CHECK(open > 0), high INTEGER NOT NULL, low INTEGER NOT NULL, close INTEGER NOT NULL CHECK(close > 0), volume INTEGER NOT NULL CHECK(volume >= 0), PRIMARY KEY(dataset_id, instrument_id, date));
  PRAGMA user_version = 1;
`;
export function validateState(value: unknown): asserts value is AppState {
  const state = value as AppState;
  if (
    !state ||
    state.version !== 1 ||
    !['en', 'zh-TW'].includes(state.locale) ||
    !['TW', 'US'].includes(state.market) ||
    !Array.isArray(state.completedLessons) ||
    !Array.isArray(state.bookmarks) ||
    !Array.isArray(state.readResources) ||
    !Array.isArray(state.forecasts) ||
    !state.answers ||
    !state.portfolios
  )
    throw new Error('Stored state is invalid. Data has not been overwritten.');
  for (const market of ['TW', 'US'] as const) {
    const p = state.portfolios[market];
    if (
      !p ||
      p.market !== market ||
      p.currency !== (market === 'TW' ? 'TWD' : 'USD') ||
      !Number.isSafeInteger(p.cash) ||
      p.cash < 0 ||
      !Number.isSafeInteger(p.initialCash) ||
      p.initialCash <= 0 ||
      ![20, 60].includes(p.length) ||
      !Number.isInteger(p.day) ||
      p.day < 0 ||
      p.day >= p.length ||
      !reconcile(p)
    )
      throw new Error('Portfolio failed reconciliation. Data has not been overwritten.');
  }
}
export class Repository {
  constructor(private db: Database) {}
  async initialize(): Promise<void> {
    await this.db.execAsync(schema);
  }
  async load(): Promise<{ state: AppState; revision: number } | null> {
    const row = await this.db.getFirstAsync<{ payload: string; revision: number }>(
      'SELECT payload, revision FROM app_state WHERE id = 1',
    );
    if (!row) return null;
    const state: unknown = JSON.parse(row.payload);
    validateState(state);
    return { state, revision: row.revision };
  }
  async save(state: AppState, expectedRevision: number): Promise<number> {
    validateState(state);
    await this.db.execAsync('BEGIN IMMEDIATE');
    try {
      const row = await this.db.getFirstAsync<{ revision: number }>(
        'SELECT revision FROM app_state WHERE id = 1',
      );
      if ((row?.revision ?? 0) !== expectedRevision)
        throw new Error('This session changed in another window. Reload before trading.');
      for (const portfolio of Object.values(state.portfolios)) {
        for (const entry of portfolio.entries) {
          const payload = JSON.stringify(entry);
          const existing = await this.db.getFirstAsync<{ payload: string }>(
            'SELECT payload FROM trade_journal WHERE session_id = ? AND entry_id = ?',
            entry.sessionId,
            entry.id,
          );
          if (existing && existing.payload !== payload)
            throw new Error('An existing ledger entry cannot be changed.');
          if (!existing)
            await this.db.runAsync(
              'INSERT INTO trade_journal(session_id, entry_id, instrument_id, kind, date, cash_delta, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
              entry.sessionId,
              entry.id,
              entry.instrumentId,
              entry.kind,
              entry.date,
              entry.cashDelta,
              payload,
            );
        }
      }
      const next = expectedRevision + 1;
      await this.db.runAsync(
        'INSERT INTO app_state(id, revision, payload) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, payload = excluded.payload',
        next,
        JSON.stringify(state),
      );
      await this.db.execAsync('COMMIT');
      return next;
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }
}

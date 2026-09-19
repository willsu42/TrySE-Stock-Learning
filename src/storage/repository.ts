import { AppState, Portfolio } from '../domain/types';
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
    !state.portfolios ||
    (state.quizAttempts !== undefined && !Array.isArray(state.quizAttempts)) ||
    ![...state.completedLessons, ...state.bookmarks, ...state.readResources].every(
      (item) => typeof item === 'string',
    ) ||
    !Object.values(state.answers).every((answer) => Number.isInteger(answer) && answer >= 0)
  )
    throw new Error('Stored state is invalid. Data has not been overwritten.');
  for (const market of ['TW', 'US'] as const) {
    const p = state.portfolios[market];
    if (
      !p ||
      typeof p.id !== 'string' ||
      !p.id ||
      typeof p.datasetId !== 'string' ||
      !p.datasetId ||
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
  if (state.portfolios.TW.id === state.portfolios.US.id)
    throw new Error('Portfolios must have independent session IDs.');
  const attemptIds = new Set<string>();
  for (const attempt of state.quizAttempts ?? []) {
    if (
      !attempt ||
      typeof attempt.id !== 'string' ||
      !attempt.id ||
      attemptIds.has(attempt.id) ||
      typeof attempt.questionId !== 'string' ||
      !attempt.questionId ||
      attempt.questionVersion !== 'v1' ||
      !Number.isInteger(attempt.answerIndex) ||
      attempt.answerIndex < 0 ||
      typeof attempt.correct !== 'boolean' ||
      !['en', 'zh-TW'].includes(attempt.locale) ||
      !Number.isFinite(Date.parse(attempt.createdAt))
    )
      throw new Error('Quiz history is invalid. Data has been preserved.');
    attemptIds.add(attempt.id);
  }
  const forecastIds = new Set<string>();
  for (const forecast of state.forecasts) {
    if (
      !forecast ||
      !forecast.id ||
      forecastIds.has(forecast.id) ||
      typeof forecast.revealed !== 'boolean' ||
      ![1, 5].includes(forecast.horizon) ||
      !forecast.instrumentId ||
      !forecast.modelVersion ||
      !forecast.datasetId ||
      !Number.isFinite(Date.parse(forecast.cutoff)) ||
      !Number.isFinite(Date.parse(forecast.target)) ||
      forecast.target <= forecast.cutoff ||
      ![forecast.prediction, forecast.baseline, forecast.model].every(
        (value) => Number.isSafeInteger(value) && value > 0,
      )
    )
      throw new Error('Forecast history is invalid. Data has been preserved.');
    forecastIds.add(forecast.id);
  }
}
export class Repository {
  constructor(private db: Database) {}
  async initialize(): Promise<void> {
    const version = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (version && version.user_version > 1)
      throw new Error('This database needs a newer app. Data has not been changed.');
    await this.db.execAsync(schema);
  }
  private async verifyJournal(portfolio: Portfolio): Promise<void> {
    const count = await this.db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM trade_journal WHERE session_id = ?',
      portfolio.id,
    );
    if (count?.total !== portfolio.entries.length)
      throw new Error('Saved portfolio and trade journal do not match. Data has been preserved.');
    for (const entry of portfolio.entries) {
      const saved = await this.db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM trade_journal WHERE session_id = ? AND entry_id = ?',
        portfolio.id,
        entry.id,
      );
      if (!saved || saved.payload !== JSON.stringify(entry))
        throw new Error('Saved portfolio and trade journal do not match. Data has been preserved.');
    }
  }
  async load(): Promise<{ state: AppState; revision: number } | null> {
    const row = await this.db.getFirstAsync<{ payload: string; revision: number }>(
      'SELECT payload, revision FROM app_state WHERE id = 1',
    );
    if (!row) return null;
    const state: unknown = JSON.parse(row.payload);
    validateState(state);
    for (const portfolio of Object.values(state.portfolios)) await this.verifyJournal(portfolio);
    return { state, revision: row.revision };
  }
  async save(state: AppState, expectedRevision: number): Promise<number> {
    validateState(state);
    await this.db.execAsync('BEGIN IMMEDIATE');
    try {
      const row = await this.db.getFirstAsync<{ revision: number; payload: string }>(
        'SELECT revision, payload FROM app_state WHERE id = 1',
      );
      if ((row?.revision ?? 0) !== expectedRevision)
        throw new Error('This session changed in another window. Reload before trading.');
      if (row) {
        const previous: unknown = JSON.parse(row.payload);
        validateState(previous);
        for (const market of ['TW', 'US'] as const) {
          const before = previous.portfolios[market],
            after = state.portfolios[market];
          await this.verifyJournal(before);
          if (before.id === after.id) {
            if (
              before.datasetId !== after.datasetId ||
              before.initialCash !== after.initialCash ||
              before.length !== after.length ||
              after.day < before.day
            )
              throw new Error('Replay settings cannot change within an existing session.');
            assertAppendOnly(before.entries, after.entries, 'Trade history');
          } else {
            const used = await this.db.getFirstAsync(
              'SELECT entry_id FROM trade_journal WHERE session_id = ? LIMIT 1',
              after.id,
            );
            if (used) throw new Error('A reset must use a new session ID.');
            if (after.day !== 0 || after.entries.length !== 0)
              throw new Error('A reset must start with a fresh portfolio.');
          }
        }
        assertAppendOnly(previous.quizAttempts ?? [], state.quizAttempts ?? [], 'Quiz history');
        if (state.forecasts.length < previous.forecasts.length)
          throw new Error('Locked forecasts cannot be removed.');
        for (const [index, before] of previous.forecasts.entries()) {
          const after = state.forecasts[index];
          if (
            !after ||
            (before.revealed && !after.revealed) ||
            JSON.stringify({ ...before, revealed: false }) !==
              JSON.stringify({ ...after, revealed: false })
          )
            throw new Error('A locked forecast cannot be changed.');
        }
      }
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
function assertAppendOnly<T>(previous: T[], next: T[], label: string): void {
  if (
    next.length < previous.length ||
    previous.some((entry, index) => JSON.stringify(entry) !== JSON.stringify(next[index]))
  )
    throw new Error(`${label} cannot be removed or rewritten.`);
}

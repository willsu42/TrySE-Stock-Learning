import { openDatabaseAsync } from 'expo-sqlite';
import { dataset, history, instruments, installPriceCache } from '../data/market';
import { Candle } from '../domain/types';
import { Repository } from './repository';

let opening: Promise<Repository> | undefined;
export function openRepository(): Promise<Repository> {
  if (!opening)
    opening = initialize().catch((error) => {
      opening = undefined;
      throw error;
    });
  return opening;
}
async function initialize(): Promise<Repository> {
  const db = await openDatabaseAsync('tryse-v1.db');
  const repository = new Repository(db);
  await repository.initialize();
  const exists = await db.getFirstAsync('SELECT id FROM datasets WHERE id = ?', dataset.id);
  if (!exists) {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      await db.runAsync(
        'INSERT INTO datasets(id, kind, source, calendar) VALUES (?, ?, ?, ?)',
        dataset.id,
        dataset.kind,
        dataset.source,
        dataset.calendar,
      );
      for (const instrument of instruments) {
        await db.runAsync(
          'INSERT OR IGNORE INTO instruments(id, symbol, market, currency, payload) VALUES (?, ?, ?, ?, ?)',
          instrument.id,
          instrument.symbol,
          instrument.market,
          instrument.currency,
          JSON.stringify(instrument),
        );
        const rows = history(instrument.id);
        const sqlQuote = (value: string) => "'" + value.replace(/'/g, "''") + "'";
        for (let offset = 0; offset < rows.length; offset += 200) {
          // Only our validated bundled dataset reaches this batch writer; downloaded files use the importer.
          const values = rows
            .slice(offset, offset + 200)
            .map(
              (row) =>
                `(${sqlQuote(dataset.id)},${sqlQuote(instrument.id)},${sqlQuote(row.date)},${row.open},${row.high},${row.low},${row.close},${row.volume})`,
            )
            .join(',');
          await db.execAsync(`INSERT INTO daily_prices VALUES ${values}`);
        }
      }
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }
  const cache: Record<string, Candle[]> = {};
  for (const instrument of instruments) {
    cache[instrument.id] = await db.getAllAsync<Candle>(
      'SELECT date, open, high, low, close, volume FROM daily_prices WHERE dataset_id = ? AND instrument_id = ? ORDER BY date',
      dataset.id,
      instrument.id,
    );
  }
  installPriceCache(cache);
  return repository;
}

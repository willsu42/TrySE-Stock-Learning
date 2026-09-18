import catalog from './instruments.json';
import demo from './demo-prices.json';
import { Candle, Instrument, Market, Portfolio } from '../domain/types';

export const instruments = catalog as Instrument[];
export const dataset = {
  id: demo.id,
  kind: demo.kind,
  source: demo.source,
  calendar: demo.calendar,
};
let series = demo.series as Record<string, Candle[]>;
// Seed data is the test fallback. The app replaces it with the persisted SQLite dataset on boot.
export function installPriceCache(persisted: Record<string, Candle[]>) {
  for (const stock of instruments) {
    if (!persisted[stock.id]?.length) throw new Error(`Missing stored prices for ${stock.id}`);
  }
  series = persisted;
}
export const instrumentById = Object.fromEntries(instruments.map((item) => [item.id, item]));
export const replayDates = Object.fromEntries(
  (['TW', 'US'] as Market[]).map((market) => [
    market,
    history(instruments.find((item) => item.market === market)!.id)
      .filter((row) => row.date >= '2024-01-02')
      .slice(0, 60)
      .map((row) => row.date),
  ]),
) as Record<Market, string[]>;
export function history(id: string): readonly Candle[] {
  return series[id] ?? [];
}
export function candle(id: string, date: string): Candle | undefined {
  return series[id]?.find((row) => row.date === date);
}
export function currentDate(portfolio: Portfolio): string {
  return replayDates[portfolio.market][portfolio.day]!;
}
export function visibleHistory(id: string, cutoff: string, count = 45): Candle[] {
  return history(id)
    .filter((row) => row.date <= cutoff)
    .slice(-count);
}
export function pricesOn(market: Market, date: string): Record<string, number> {
  return Object.fromEntries(
    instruments
      .filter((stock) => stock.market === market)
      .flatMap((stock) => {
        const row = candle(stock.id, date);
        return row ? [[stock.id, row.close]] : [];
      }),
  );
}

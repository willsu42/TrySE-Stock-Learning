import {
  advanceSession,
  applyAction,
  executeOrder,
  newPortfolio,
  parseMoney,
  reconcile,
  valuation,
} from '../src/domain/engine';
import { Instrument, Portfolio } from '../src/domain/types';
const stock: Instrument = {
  id: 'TW:2330',
  symbol: '2330',
  name: { en: 'TSMC', 'zh-TW': '台積電' },
  market: 'TW',
  currency: 'TWD',
  sector: { en: 'Chips', 'zh-TW': '晶片' },
  seedPrice: 10000,
};
const date = '2024-01-02';
const initial = () => ({
  ...newPortfolio('TW', 'test-v1', 'session'),
  initialCash: 100000,
  cash: 100000,
});
const trade = (
  p: Portfolio,
  side: 'buy' | 'sell',
  quantity: number,
  price: number,
  id = String(p.entries.length),
) =>
  executeOrder(
    p,
    { id, instrumentId: stock.id, side, quantity },
    { instrument: stock, date, price, datasetId: 'test-v1' },
    date,
  );
describe('cash and share accounting', () => {
  test('reconciliation rejects a journal with invented realized profit', () => {
    const p = trade(initial(), 'buy', 1, 10000);
    expect(reconcile({ ...p, entries: p.entries.map((e) => ({ ...e, realized: 99999 })) })).toBe(
      false,
    );
  });
  test('reconciliation rejects duplicate or foreign-session entries', () => {
    const p = trade(initial(), 'buy', 1, 10000);
    expect(reconcile({ ...p, entries: p.entries.map((e) => ({ ...e, sessionId: 'other' })) })).toBe(
      false,
    );
  });
  test('independently worked multiple-purchase, partial-sale scenario', () => {
    let p = trade(initial(), 'buy', 2, 10000);
    p = trade(p, 'buy', 2, 12000);
    expect(p.cash).toBe(56000);
    expect(p.positions[stock.id]).toEqual({ shares: 4, cost: 44000 });
    p = trade(p, 'sell', 1, 13000);
    expect(p.cash).toBe(69000);
    expect(p.positions[stock.id]).toEqual({ shares: 3, cost: 33000 });
    expect(valuation(p, { [stock.id]: 12500 })).toEqual({
      marketValue: 37500,
      cost: 33000,
      equity: 106500,
      realized: 2000,
      unrealized: 4500,
      totalReturn: 6500,
    });
    expect(reconcile(p)).toBe(true);
    p = trade(p, 'sell', 3, 9000);
    expect(p.cash).toBe(96000);
    expect(p.positions[stock.id]).toEqual({ shares: 0, cost: 0 });
    expect(reconcile(p)).toBe(true);
  });
  test.each([0, -1, 1.5, NaN, Infinity])(
    'rejects invalid quantity %s without mutation',
    (quantity) => {
      const p = initial(),
        before = JSON.stringify(p);
      expect(() => trade(p, 'buy', quantity, 100)).toThrow('INVALID_QUANTITY');
      expect(JSON.stringify(p)).toBe(before);
    },
  );
  test('rejects overspending and overselling', () => {
    const p = initial();
    expect(() => trade(p, 'buy', 11, 10000)).toThrow('INSUFFICIENT_CASH');
    expect(() => trade(p, 'sell', 1, 10000)).toThrow('INSUFFICIENT_SHARES');
    expect(reconcile(p)).toBe(true);
  });
  test('duplicate order is not executed twice', () => {
    const p = trade(initial(), 'buy', 1, 10000, 'same');
    expect(() => trade(p, 'buy', 1, 10000, 'same')).toThrow('DUPLICATE_ORDER');
    expect(p.cash).toBe(90000);
  });
  test('instruments and currencies are isolated', () => {
    const p = trade(initial(), 'buy', 2, 10000);
    const second = { ...stock, id: 'TW:2454', symbol: '2454' };
    const updated = executeOrder(
      p,
      { id: 'b', instrumentId: second.id, side: 'buy', quantity: 1 },
      { instrument: second, date, price: 20000, datasetId: 'test-v1' },
      date,
    );
    expect(updated.positions[stock.id]).toEqual({ shares: 2, cost: 20000 });
    expect(updated.positions[second.id]).toEqual({ shares: 1, cost: 20000 });
    expect(() =>
      executeOrder(
        p,
        { id: 'x', instrumentId: stock.id, side: 'buy', quantity: 1 },
        {
          instrument: { ...stock, currency: 'USD', market: 'US' },
          date,
          price: 100,
          datasetId: 'test-v1',
        },
        date,
      ),
    ).toThrow('WRONG_MARKET');
  });
  test('weighted cost rounding leaves no residue on final sale', () => {
    let p = trade(initial(), 'buy', 3, 101);
    p = trade(p, 'buy', 1, 102);
    p = trade(p, 'sell', 1, 110);
    expect(p.positions[stock.id]!.cost).toBe(304);
    p = trade(p, 'sell', 3, 110);
    expect(p.positions[stock.id]!.cost).toBe(0);
    expect(reconcile(p)).toBe(true);
  });
  test('future/different-dataset quotes cannot fill an order', () => {
    for (const quote of [
      { date: '2025-01-01', datasetId: 'test-v1' },
      { date, datasetId: 'other' },
    ])
      expect(() =>
        executeOrder(
          initial(),
          { id: 'x', instrumentId: stock.id, side: 'buy', quantity: 1 },
          { instrument: stock, price: 100, ...quote },
          date,
        ),
      ).toThrow('STALE_QUOTE');
  });
  test('price changes revalue holdings but do not create cash', () => {
    const p = trade(initial(), 'buy', 2, 10000);
    expect(valuation(p, { [stock.id]: 11000 }).totalReturn).toBe(2000);
    expect(p.cash).toBe(80000);
  });
  test('cannot value a holding with a missing price', () =>
    expect(() => valuation(trade(initial(), 'buy', 1, 100), {})).toThrow('MISSING_PRICE'));
  test('cash and stock dividends/splits reconcile and are idempotent', () => {
    let p = trade(initial(), 'buy', 2, 10000);
    const action = {
      id: 'split',
      kind: 'split' as const,
      instrumentId: stock.id,
      date,
      numerator: 2,
      denominator: 1,
    };
    p = applyAction(p, action);
    expect(p.positions[stock.id]).toEqual({ shares: 4, cost: 20000 });
    expect(applyAction(p, action)).toBe(p);
    p = applyAction(p, {
      id: 'dividend',
      kind: 'dividend',
      instrumentId: stock.id,
      date,
      amountPerShare: 125,
    });
    expect(p.cash).toBe(80500);
    expect(reconcile(p)).toBe(true);
  });
  test('fractional split requires an explicit policy', () =>
    expect(() =>
      applyAction(trade(initial(), 'buy', 1, 10000), {
        id: 'split',
        kind: 'split',
        instrumentId: stock.id,
        date,
        numerator: 1,
        denominator: 2,
      }),
    ).toThrow('UNSUPPORTED_ACTION'));
  test('advance uses supplied sessions, skipping holidays', () => {
    const p = trade(initial(), 'buy', 1, 10000),
      dates = [date, '2024-01-05'];
    expect(advanceSession(p, dates, { [stock.id]: 11000 }).day).toBe(1);
    expect(() => advanceSession(p, dates, {})).toThrow('MISSING_PRICE');
    expect(p.day).toBe(0);
    expect(() => advanceSession({ ...p, day: 59 }, dates, {})).toThrow('SCENARIO_ENDED');
  });
  test('rejects unsafe values and parses decimal inputs exactly', () => {
    expect(parseMoney('0.29')).toBe(29);
    expect(parseMoney('1e4')).toBe(null);
    expect(parseMoney('1.001')).toBe(null);
    expect(() => trade(initial(), 'buy', Number.MAX_SAFE_INTEGER, 100)).toThrow('OVERFLOW');
  });
});

import { CorporateAction, Entry, Market, Order, Portfolio, Quote } from './types';

export type ErrorCode =
  | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_CASH'
  | 'INSUFFICIENT_SHARES'
  | 'WRONG_MARKET'
  | 'INVALID_PRICE'
  | 'STALE_QUOTE'
  | 'DUPLICATE_ORDER'
  | 'SCENARIO_ENDED'
  | 'MISSING_PRICE'
  | 'UNSUPPORTED_ACTION'
  | 'OVERFLOW';
export class TradingError extends Error {
  constructor(public code: ErrorCode) {
    super(code);
    this.name = 'TradingError';
  }
}
export function safeInteger(value: number): number {
  if (!Number.isSafeInteger(value)) throw new TradingError('OVERFLOW');
  return value;
}
export function parseMoney(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole = '0', fraction = ''] = value.trim().split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
export function newPortfolio(
  market: Market,
  datasetId: string,
  id: string,
  length: 20 | 60 = 60,
): Portfolio {
  const initialCash = market === 'TW' ? 100_000_000 : 10_000_000;
  return {
    id,
    datasetId,
    market,
    currency: market === 'TW' ? 'TWD' : 'USD',
    initialCash,
    cash: initialCash,
    day: 0,
    length,
    positions: {},
    entries: [],
  };
}
export function executeOrder(
  portfolio: Portfolio,
  order: Order,
  quote: Quote,
  currentDate: string,
): Portfolio {
  if (!order.id || portfolio.entries.some((entry) => entry.id === order.id))
    throw new TradingError('DUPLICATE_ORDER');
  if (!Number.isSafeInteger(order.quantity) || order.quantity <= 0)
    throw new TradingError('INVALID_QUANTITY');
  if (
    quote.instrument.id !== order.instrumentId ||
    quote.instrument.market !== portfolio.market ||
    quote.instrument.currency !== portfolio.currency
  )
    throw new TradingError('WRONG_MARKET');
  if (quote.date !== currentDate || quote.datasetId !== portfolio.datasetId)
    throw new TradingError('STALE_QUOTE');
  if (!Number.isSafeInteger(quote.price) || quote.price <= 0)
    throw new TradingError('INVALID_PRICE');
  if (portfolio.day >= portfolio.length) throw new TradingError('SCENARIO_ENDED');
  if (order.side !== 'buy' && order.side !== 'sell') throw new TradingError('INVALID_QUANTITY');
  const amount = safeInteger(order.quantity * quote.price);
  const previous = portfolio.positions[order.instrumentId] ?? { shares: 0, cost: 0 };
  let shares: number,
    cost: number,
    cashDelta: number,
    realized = 0;
  if (order.side === 'buy') {
    if (amount > portfolio.cash) throw new TradingError('INSUFFICIENT_CASH');
    shares = safeInteger(previous.shares + order.quantity);
    cost = safeInteger(previous.cost + amount);
    cashDelta = -amount;
  } else {
    if (order.quantity > previous.shares) throw new TradingError('INSUFFICIENT_SHARES');
    // Allocate weighted-average book cost, rounding half up to the nearest minor unit.
    // A final sale always releases the entire remaining cost, avoiding rounding residue.
    const releasedCost =
      order.quantity === previous.shares
        ? previous.cost
        : Number(
            (BigInt(previous.cost) * BigInt(order.quantity) * 2n + BigInt(previous.shares)) /
              (2n * BigInt(previous.shares)),
          );
    shares = previous.shares - order.quantity;
    cost = previous.cost - releasedCost;
    cashDelta = amount;
    realized = amount - releasedCost;
  }
  const entry: Entry = {
    id: order.id,
    sessionId: portfolio.id,
    kind: order.side,
    instrumentId: order.instrumentId,
    date: currentDate,
    quantity: order.quantity,
    price: quote.price,
    cashDelta,
    costDelta: cost - previous.cost,
    realized,
  };
  return {
    ...portfolio,
    cash: safeInteger(portfolio.cash + cashDelta),
    positions: { ...portfolio.positions, [order.instrumentId]: { shares, cost } },
    entries: [...portfolio.entries, entry],
  };
}
export function applyAction(portfolio: Portfolio, action: CorporateAction): Portfolio {
  if (portfolio.entries.some((entry) => entry.id === action.id)) return portfolio;
  const old = portfolio.positions[action.instrumentId] ?? { shares: 0, cost: 0 };
  let shares = old.shares,
    cashDelta = 0;
  if (action.kind === 'dividend') {
    if (!Number.isSafeInteger(action.amountPerShare) || action.amountPerShare < 0)
      throw new TradingError('UNSUPPORTED_ACTION');
    cashDelta = safeInteger(old.shares * action.amountPerShare);
  } else {
    if (
      !Number.isSafeInteger(action.numerator) ||
      !Number.isSafeInteger(action.denominator) ||
      action.numerator <= 0 ||
      action.denominator <= 0
    )
      throw new TradingError('UNSUPPORTED_ACTION');
    const product = safeInteger(old.shares * action.numerator);
    if (product % action.denominator !== 0) throw new TradingError('UNSUPPORTED_ACTION');
    shares = safeInteger(product / action.denominator);
  }
  return {
    ...portfolio,
    cash: safeInteger(portfolio.cash + cashDelta),
    positions: { ...portfolio.positions, [action.instrumentId]: { shares, cost: old.cost } },
    entries: [
      ...portfolio.entries,
      {
        id: action.id,
        sessionId: portfolio.id,
        kind: action.kind,
        instrumentId: action.instrumentId,
        date: action.date,
        quantity: shares - old.shares,
        price: action.kind === 'dividend' ? action.amountPerShare : 0,
        cashDelta,
        costDelta: 0,
        realized: cashDelta,
      },
    ],
  };
}
export function advanceSession(
  portfolio: Portfolio,
  dates: readonly string[],
  prices: Record<string, number>,
  actions: CorporateAction[] = [],
): Portfolio {
  if (portfolio.day >= portfolio.length - 1) throw new TradingError('SCENARIO_ENDED');
  const nextDate = dates[portfolio.day + 1];
  if (!nextDate) throw new TradingError('MISSING_PRICE');
  for (const [id, position] of Object.entries(portfolio.positions)) {
    if (position.shares > 0 && (!Number.isSafeInteger(prices[id]) || prices[id]! <= 0))
      throw new TradingError('MISSING_PRICE');
  }
  const updated = actions
    .filter((action) => action.date === nextDate)
    .reduce(applyAction, portfolio);
  return { ...updated, day: portfolio.day + 1 };
}
export function valuation(portfolio: Portfolio, prices: Record<string, number>) {
  let marketValue = 0,
    cost = 0;
  for (const [id, position] of Object.entries(portfolio.positions)) {
    if (!position.shares) continue;
    const price = prices[id];
    if (!Number.isSafeInteger(price) || price! <= 0) throw new TradingError('MISSING_PRICE');
    marketValue = safeInteger(marketValue + safeInteger(position.shares * price!));
    cost = safeInteger(cost + position.cost);
  }
  const equity = safeInteger(portfolio.cash + marketValue);
  const realized = portfolio.entries.reduce((sum, entry) => safeInteger(sum + entry.realized), 0);
  return {
    marketValue,
    cost,
    equity,
    realized,
    unrealized: marketValue - cost,
    totalReturn: equity - portfolio.initialCash,
  };
}
export function reconcile(portfolio: Portfolio): boolean {
  if (
    portfolio.cash !==
    portfolio.initialCash + portfolio.entries.reduce((sum, entry) => sum + entry.cashDelta, 0)
  )
    return false;
  const ids = new Set([
    ...Object.keys(portfolio.positions),
    ...portfolio.entries.map((entry) => entry.instrumentId),
  ]);
  return [...ids].every((id) => {
    const entries = portfolio.entries.filter((entry) => entry.instrumentId === id);
    const shares = entries.reduce(
      (sum, entry) =>
        sum +
        (entry.kind === 'sell' ? -entry.quantity : entry.kind === 'dividend' ? 0 : entry.quantity),
      0,
    );
    const cost = entries.reduce((sum, entry) => sum + entry.costDelta, 0);
    const position = portfolio.positions[id] ?? { shares: 0, cost: 0 };
    return (
      position.shares === shares &&
      position.cost === cost &&
      shares >= 0 &&
      cost >= 0 &&
      (shares !== 0 || cost === 0)
    );
  });
}

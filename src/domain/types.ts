export type Locale = 'en' | 'zh-TW';
export type Market = 'TW' | 'US';
export type Currency = 'TWD' | 'USD';
export type Copy = { en: string; 'zh-TW': string };
export interface Instrument {
  id: string;
  symbol: string;
  name: Copy;
  market: Market;
  currency: Currency;
  sector: Copy;
  seedPrice: number;
}
export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export interface Position {
  shares: number;
  cost: number;
}
export interface Entry {
  id: string;
  sessionId: string;
  kind: 'buy' | 'sell' | 'dividend' | 'split';
  instrumentId: string;
  date: string;
  quantity: number;
  price: number;
  cashDelta: number;
  costDelta: number;
  realized: number;
}
export interface Portfolio {
  id: string;
  datasetId: string;
  market: Market;
  currency: Currency;
  initialCash: number;
  cash: number;
  day: number;
  length: 20 | 60;
  positions: Record<string, Position>;
  entries: Entry[];
}
export interface ForecastAttempt {
  id: string;
  instrumentId: string;
  cutoff: string;
  target: string;
  horizon: 1 | 5;
  prediction: number;
  baseline: number;
  model: number;
  modelVersion: string;
  datasetId: string;
  revealed: boolean;
}
export interface AppState {
  version: 1;
  locale: Locale;
  market: Market;
  portfolios: Record<Market, Portfolio>;
  completedLessons: string[];
  answers: Record<string, number>;
  bookmarks: string[];
  readResources: string[];
  forecasts: ForecastAttempt[];
  /** Optional for compatibility with version-1 snapshots saved before attempt history existed. */
  quizAttempts?: QuizAttempt[];
}
export interface QuizAttempt {
  id: string;
  questionId: string;
  questionVersion: 'v1';
  answerIndex: number;
  correct: boolean;
  createdAt: string;
  locale: Locale;
}
export type Order = { id: string; instrumentId: string; side: 'buy' | 'sell'; quantity: number };
export interface Quote {
  instrument: Instrument;
  date: string;
  price: number;
  datasetId: string;
}
export type CorporateAction =
  | { id: string; instrumentId: string; date: string; kind: 'dividend'; amountPerShare: number }
  | {
      id: string;
      instrumentId: string;
      date: string;
      kind: 'split';
      numerator: number;
      denominator: number;
    };

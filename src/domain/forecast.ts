import { ForecastAttempt } from './types';
export interface ModelForecast {
  instrumentId: string;
  cutoff: string;
  target: string;
  horizon: number;
  baseline: number;
  prediction: number;
  modelVersion: string;
  datasetId: string;
}
export function lockForecast(
  record: ModelForecast,
  prediction: number,
  id: string,
): ForecastAttempt {
  if (!Number.isSafeInteger(prediction) || prediction <= 0) throw new Error('INVALID_PRICE');
  if (![1, 5].includes(record.horizon) || record.target <= record.cutoff)
    throw new Error('Invalid forecast horizon');
  return {
    id,
    instrumentId: record.instrumentId,
    cutoff: record.cutoff,
    target: record.target,
    horizon: record.horizon as 1 | 5,
    prediction,
    baseline: record.baseline,
    model: record.prediction,
    modelVersion: record.modelVersion,
    datasetId: record.datasetId,
    revealed: false,
  };
}
export function evaluateForecast(attempt: ForecastAttempt, actual: number) {
  if (!attempt.revealed) throw new Error('Lock and reveal your prediction first.');
  if (!Number.isSafeInteger(actual) || actual <= 0) throw new Error('INVALID_PRICE');
  return {
    learner: Math.abs(attempt.prediction - actual),
    baseline: Math.abs(attempt.baseline - actual),
    model: Math.abs(attempt.model - actual),
  };
}

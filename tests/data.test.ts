import {
  candle,
  currentDate,
  dataset,
  history,
  instruments,
  visibleHistory,
} from '../src/data/market';
import { lessons, questions, resources } from '../src/data/learning';
import { newPortfolio } from '../src/domain/engine';
import forecasts from '../src/data/forecasts.json';
import { evaluateForecast, lockForecast } from '../src/domain/forecast';
test('demo data is clearly synthetic with the approved 20 instruments', () => {
  expect(dataset.kind).toBe('synthetic');
  expect(instruments).toHaveLength(20);
  expect(instruments.some((i) => i.symbol === '3481')).toBe(false);
  for (const market of ['TW', 'US'])
    expect(instruments.filter((i) => i.market === market)).toHaveLength(10);
  for (const i of instruments) {
    let previous = '';
    for (const bar of history(i.id)) {
      expect(bar.date > previous).toBe(true);
      previous = bar.date;
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close));
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close));
      expect(Number.isSafeInteger(bar.close)).toBe(true);
    }
  }
});
test('UI history never includes prices beyond replay cutoff', () => {
  const p = newPortfolio('TW', dataset.id, 'x'),
    cutoff = currentDate(p),
    shown = visibleHistory('TW:2330', cutoff);
  expect(shown.length).toBeGreaterThan(0);
  expect(shown.every((row) => row.date <= cutoff)).toBe(true);
  expect(shown[shown.length - 1]?.date).toBe(cutoff);
});
test('each forecast points to a real future fixture session and a pinned dataset', () => {
  for (const forecast of forecasts) {
    expect(forecast.datasetId).toBe(dataset.id);
    const rows = history(forecast.instrumentId);
    const cutoff = rows.findIndex((r) => r.date === forecast.cutoff);
    expect(rows[cutoff + forecast.horizon]?.date).toBe(forecast.target);
    expect(candle(forecast.instrumentId, forecast.cutoff)?.close).toBe(forecast.baseline);
  }
});
test('forecast evaluation requires a locked, revealed attempt', () => {
  const attempt = lockForecast(forecasts[0]!, 10500, 'x');
  expect(() => evaluateForecast(attempt, 10200)).toThrow('reveal');
  expect(evaluateForecast({ ...attempt, revealed: true }, 10200).learner).toBe(300);
  expect(() => lockForecast(forecasts[0]!, 0, 'x')).toThrow('INVALID_PRICE');
});
test('learning content has both languages, valid answers, and valid resource references', () => {
  expect(lessons).toHaveLength(9);
  expect(resources.length).toBeGreaterThanOrEqual(12);
  for (const lesson of lessons) {
    expect(questions.some((q) => q.lessonId === lesson.id)).toBe(true);
    expect(lesson.title.en).toBeTruthy();
    expect(lesson.title['zh-TW']).toBeTruthy();
    for (const id of lesson.resources) expect(resources.some((r) => r.id === id)).toBe(true);
  }
  for (const question of questions) {
    expect(question.options[question.answer]).toBeDefined();
    expect(question.explanation.en).toBeTruthy();
    expect(question.explanation['zh-TW']).toBeTruthy();
  }
});

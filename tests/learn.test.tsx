import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Learn } from '../src/screens/Learn';
import { newPortfolio } from '../src/domain/engine';
import { AppState } from '../src/domain/types';

let mockState: AppState;
const mockUpdate = jest.fn(async (change: (state: AppState) => AppState) => {
  mockState = change(mockState);
  return true;
});
jest.mock('../src/storage/state', () => ({
  uniqueId: () => `attempt-${mockState.quizAttempts?.length ?? 0}`,
  useStore: () => ({ state: mockState, update: mockUpdate, busy: false }),
}));
beforeEach(() => {
  mockUpdate.mockClear();
  mockState = {
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
test('a wrong answer gets an explanation, then a correct answer unlocks completion', async () => {
  const view = await render(<Learn navigate={jest.fn()} />);
  await fireEvent.press(screen.getByText('A small piece of a company'));
  await fireEvent.press(screen.getByText('B. A guaranteed deposit'));
  await view.rerender(<Learn navigate={jest.fn()} />);
  expect(screen.getByText('Let’s work through it.')).toBeTruthy();
  expect(mockState.completedLessons).toHaveLength(0);
  await fireEvent.press(screen.getByText('A. Partial ownership'));
  await view.rerender(<Learn navigate={jest.fn()} />);
  await fireEvent.press(screen.getByText('Complete this lesson'));
  expect(mockState.completedLessons).toEqual(['ownership']);
  expect(mockState.quizAttempts?.map((attempt) => attempt.correct)).toEqual([false, true]);
  mockState = { ...mockState, locale: 'zh-TW' };
  await view.rerender(<Learn navigate={jest.fn()} />);
  expect(screen.getByText('已完成課程 ✓')).toBeTruthy();
});

import { AppState } from './types';

interface KnowledgeCheck {
  id: string;
  options: readonly unknown[];
  answer: number;
}
export function recordAnswer(
  state: AppState,
  question: KnowledgeCheck,
  answerIndex: number,
  id: string,
  createdAt: string,
): AppState {
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length)
    throw new Error('Invalid answer');
  const attempts = state.quizAttempts ?? [];
  if (!id || attempts.some((attempt) => attempt.id === id))
    throw new Error('Duplicate quiz attempt');
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('Invalid attempt date');
  return {
    ...state,
    answers: { ...state.answers, [question.id]: answerIndex },
    quizAttempts: [
      ...attempts,
      {
        id,
        questionId: question.id,
        questionVersion: 'v1',
        answerIndex,
        correct: answerIndex === question.answer,
        createdAt,
        locale: state.locale,
      },
    ],
  };
}

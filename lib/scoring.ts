import type { Question } from "./questions";

export const POINTS = 100;

/**
 * Single choice: full points when right.
 * Multiple choice: points × (right picks − wrong picks) ÷ number of right answers, never below 0.
 * Must stay identical to public.score_answer in supabase/migrations/0003_scores.sql.
 */
export function scoreAnswer(answer: string[], q: Pick<Question, "correct" | "multi">): number {
  if (!q.multi) return answer.length === 1 && q.correct.includes(answer[0]) ? POINTS : 0;
  const hits = answer.filter((a) => q.correct.includes(a)).length;
  const wrong = answer.length - hits;
  return Math.max(0, Math.floor((POINTS * (hits - wrong)) / q.correct.length));
}

/** One answer (or a participant with no answers: sceneIndex null) for the presenter's score summary. */
export type ReportRow = {
  participantId: string;
  nickname: string;
  joinedAt: string;
  sceneIndex: number | null;
  answer: string[] | null;
  points: number | null;
};

export type LeaderRow = { rank: number; nickname: string; score: number };
export type MyResult = { score: number; rank: number; of: number; correct: number; answered: number; questions: number };

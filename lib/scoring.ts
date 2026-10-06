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
  /** seconds after the room's first answer to this question */
  secs: number | null;
};

/**
 * Tie-break for equal scores: the faster one ranks higher. Speed = total seconds after the room's
 * first answer to each question; a question left unanswered counts as its slowest answer.
 * Must stay identical to participant_scores.secs in supabase/migrations/0013_speed_tiebreak.sql.
 */
export function totalSeconds(answers: { pid: string; sceneIndex: number; secs: number }[], pids: string[]) {
  const slowest = new Map<number, number>();
  for (const a of answers) slowest.set(a.sceneIndex, Math.max(slowest.get(a.sceneIndex) ?? 0, a.secs));
  const total = new Map(pids.map((p) => [p, [...slowest.values()].reduce((s, v) => s + v, 0)]));
  for (const a of answers) if (total.has(a.pid)) total.set(a.pid, total.get(a.pid)! - slowest.get(a.sceneIndex)! + a.secs);
  return total;
}

/** Sorts by score (high first), then time (fast first); only an exact tie on both shares a rank. */
export function rankRows<T extends { score: number; secs: number }>(rows: T[]): (T & { rank: number })[] {
  rows.sort((a, b) => b.score - a.score || a.secs - b.secs);
  return rows.map((row) => ({ ...row, rank: rows.findIndex((x) => x.score === row.score && x.secs === row.secs) + 1 }));
}

export type LeaderRow = { rank: number; nickname: string; score: number };
export type MyResult = { score: number; rank: number; of: number; correct: number; answered: number; questions: number };

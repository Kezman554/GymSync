import type { CompletedBlock, SessionResult } from './session';

// MET-based calorie estimation for a completed session. Stays content-agnostic
// like the rest of the engine: callers supply a `metLookup` rather than this
// module importing the library directly.

/** Rough seconds-per-rep used to estimate duration for reps-mode blocks — the
 * engine only records a rep count for these, not elapsed time. */
const SECONDS_PER_REP = 3;

/** Resolves an exercise id to its MET value; undefined if unknown. */
export type MetLookup = (exerciseId: string) => number | undefined;

/**
 * kcal = MET x weight(kg) x duration(hours), summed across completed blocks.
 * Blocks whose exercise id isn't found in `metLookup` are skipped.
 */
export function estimateCalories(
  completedBlocks: CompletedBlock[],
  weightKg: number,
  metLookup: MetLookup,
): number {
  let total = 0;
  for (const block of completedBlocks) {
    const met = metLookup(block.exerciseId);
    if (met == null) continue;
    const seconds = block.mode === 'timed' ? block.value : block.value * SECONDS_PER_REP;
    total += met * weightKg * (seconds / 3600);
  }
  return total;
}

/** `session` with `estimatedCalories` filled in from a weight and MET lookup. */
export function withEstimatedCalories(
  session: SessionResult,
  weightKg: number,
  metLookup: MetLookup,
): SessionResult {
  const kcal = estimateCalories(session.completedBlocks, weightKg, metLookup);
  return { ...session, estimatedCalories: Math.round(kcal * 10) / 10 };
}

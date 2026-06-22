import type { Exercise } from './exercise';
import type { MuscleGroup } from './tags';

// "Similar exercise" lookup for swaps — e.g. the user can't do a movement, or
// lacks the equipment, and wants a comparable alternative. Similarity is scored
// purely from positive tags so it stays content-agnostic.

const WEIGHTS = {
  movementPattern: 4,
  primaryMuscle: 2,
  secondaryMuscle: 1,
  position: 1,
  cardioIntensity: 1,
  impact: 1,
} as const;

function sharedCount<T>(a: T[], b: T[]): number {
  const set = new Set(b);
  return a.reduce((n, x) => (set.has(x) ? n + 1 : n), 0);
}

/** How alike two exercises are, as a non-negative score (higher = closer). */
export function similarityScore(a: Exercise, b: Exercise): number {
  let score = 0;
  if (a.movementPattern === b.movementPattern) score += WEIGHTS.movementPattern;
  score += sharedCount<MuscleGroup>(a.trains.primary, b.trains.primary) *
    WEIGHTS.primaryMuscle;
  score += sharedCount<MuscleGroup>(a.trains.secondary, b.trains.secondary) *
    WEIGHTS.secondaryMuscle;
  if (a.position === b.position) score += WEIGHTS.position;
  if (a.cardioIntensity === b.cardioIntensity) score += WEIGHTS.cardioIntensity;
  if (a.impact === b.impact) score += WEIGHTS.impact;
  return score;
}

export interface SimilarOptions {
  /** Maximum number of suggestions to return. Defaults to all matches. */
  limit?: number;
  /**
   * Only suggest exercises whose equipment the user already has (the reference
   * exercise's own equipment plus this list). Useful for "swap, same kit".
   */
  availableEquipment?: Exercise['equipment'];
}

/**
 * Find exercises similar to `ref` (an Exercise or its id), ranked best-first and
 * excluding the reference itself. Returns `[]` if the id is unknown.
 */
export function findSimilar(
  exercises: Exercise[],
  ref: Exercise | string,
  options: SimilarOptions = {},
): Exercise[] {
  const target =
    typeof ref === 'string' ? exercises.find((e) => e.id === ref) : ref;
  if (!target) return [];

  const have = options.availableEquipment
    ? new Set([...target.equipment, ...options.availableEquipment, 'none'])
    : null;

  const ranked = exercises
    .filter((e) => e.id !== target.id)
    .filter((e) => (have ? e.equipment.every((eq) => have.has(eq)) : true))
    .map((e) => ({ exercise: e, score: similarityScore(target, e) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ exercise }) => exercise);

  return options.limit != null ? ranked.slice(0, options.limit) : ranked;
}

import type { BlockMode } from './workout';

/** A block as actually performed during a session. */
export interface CompletedBlock {
  exerciseId: string;
  mode: BlockMode;
  /** Seconds held (timed) or reps done (reps), as actually completed. */
  value: number;
  /** 1-based round index when the block was part of a circuit. */
  round?: number;
}

/** The outcome of running a workout, persisted locally. */
export interface SessionResult {
  workoutId: string;
  completedBlocks: CompletedBlock[];
  /** Total elapsed time in seconds, including rest. */
  durationSeconds: number;
  /** MET-based estimate from the user profile. */
  estimatedCalories: number;
  /** Epoch milliseconds when the session finished. */
  timestamp: number;
}

// Workout model for the interval/circuit engine.
//
// The engine is content-agnostic: it references exercises by id and never
// imports the library. A workout is an ordered list of items, where an item is
// either a single Block or a Circuit that repeats a group of blocks.

/** How a block is measured. */
export type BlockMode = 'timed' | 'reps';

/** A single exercise effort within a workout. */
export interface Block {
  kind: 'block';
  /** References Exercise.id in the library. */
  exerciseId: string;
  mode: BlockMode;
  /** Seconds when `mode` is 'timed', rep count when 'reps'. */
  value: number;
  /** Rest in seconds after this block; overrides the workout default. */
  restAfter?: number;
}

/** A group of blocks repeated for a number of rounds. */
export interface Circuit {
  kind: 'circuit';
  name?: string;
  blocks: Block[];
  /** Number of rounds through `blocks`. */
  repeat: number;
  /** Rest in seconds between rounds; overrides the workout default. */
  restBetweenRounds?: number;
  /** Rest in seconds after the whole circuit; overrides the workout default. */
  restAfter?: number;
}

/** A top-level entry in a workout: a lone block or a repeating circuit. */
export type WorkoutItem = Block | Circuit;

/** Global timing defaults; individual blocks/circuits may override these. */
export interface TimingDefaults {
  /** Default seconds for a timed block that omits its own `value`-as-override. */
  work: number;
  /** Default rest in seconds after a block. */
  rest: number;
  /** Default rest in seconds between circuit rounds. */
  restBetweenRounds: number;
}

/** A complete, ordered workout. */
export interface Workout {
  id: string;
  name: string;
  defaults: TimingDefaults;
  items: WorkoutItem[];
}

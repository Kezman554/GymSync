import type { Block, Circuit, Workout } from './workout';
import type { BlockMode } from './workout';

// The engine runs a Workout as a flat list of phases. Flattening here keeps the
// state machine simple: it just walks an array, advancing on a countdown or a
// 'done' signal. All circuit/round expansion and rest-insertion happens once,
// up front, applying global timing defaults with per-block/per-circuit overrides.

export type RestReason = 'between-blocks' | 'between-rounds' | 'after-circuit';

/** A single exercise effort the user performs. */
export interface WorkPhase {
  type: 'work';
  exerciseId: string;
  mode: BlockMode;
  /** Rep target for reps mode (may be null); null for timed. */
  repsTarget: number | null;
  /** Work seconds for timed mode; null for reps (waits for 'done'). */
  duration: number | null;
  /** 1-based round within the owning circuit (1 for a standalone block). */
  round: number;
  /** Total rounds for the owning circuit (1 for a standalone block). */
  rounds: number;
  /** Name of the owning circuit, if any. */
  circuitName: string | null;
}

/** A rest interval between work phases. */
export interface RestPhase {
  type: 'rest';
  duration: number;
  reason: RestReason;
}

export type Phase = WorkPhase | RestPhase;

function workPhase(
  block: Block,
  defaultWork: number,
  round: number,
  rounds: number,
  circuitName: string | null,
): WorkPhase {
  const timed = block.mode === 'timed';
  return {
    type: 'work',
    exerciseId: block.exerciseId,
    mode: block.mode,
    repsTarget: timed ? null : block.value ?? null,
    duration: timed ? block.value ?? defaultWork : null,
    round,
    rounds,
    circuitName,
  };
}

/**
 * Expand a Workout into the ordered phases the engine will run. Rests are
 * inserted between work phases (never a leading or trailing rest), and the rest
 * duration/reason depends on context: within a round, between rounds, or after a
 * whole circuit. Zero-length rests are omitted.
 */
export function flattenWorkout(workout: Workout): Phase[] {
  const d = workout.defaults;
  const phases: Phase[] = [];

  const pushRest = (seconds: number, reason: RestReason) => {
    if (seconds > 0) phases.push({ type: 'rest', duration: seconds, reason });
  };

  for (const item of workout.items) {
    if (item.kind === 'block') {
      phases.push(workPhase(item, d.work, 1, 1, null));
      pushRest(item.restAfter ?? d.rest, 'between-blocks');
      continue;
    }

    const circuit: Circuit = item;
    const rounds = Math.max(1, circuit.repeat);
    for (let round = 1; round <= rounds; round++) {
      circuit.blocks.forEach((block, bi) => {
        phases.push(workPhase(block, d.work, round, rounds, circuit.name ?? null));

        const lastInRound = bi === circuit.blocks.length - 1;
        const lastRound = round === rounds;
        if (lastInRound && !lastRound) {
          pushRest(circuit.restBetweenRounds ?? d.restBetweenRounds, 'between-rounds');
        } else if (lastInRound && lastRound) {
          pushRest(circuit.restAfter ?? d.rest, 'after-circuit');
        } else {
          pushRest(block.restAfter ?? d.rest, 'between-blocks');
        }
      });
    }
  }

  // Never end on a rest.
  if (phases.length > 0 && phases[phases.length - 1].type === 'rest') {
    phases.pop();
  }
  return phases;
}

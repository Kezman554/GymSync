import { beforeEach, describe, expect, it } from 'vitest';
import { WorkoutEngine } from './engine';
import { flattenWorkout } from './timeline';
import type { EngineState } from './engine';
import type { Workout } from './workout';

// Sample workout: a timed lead-in, a 2-round circuit mixing reps + timed
// blocks, then a timed finisher. Exercises global timing with per-block
// overrides (jumping-jacks overrides work time; circuit uses default rests).
const workout: Workout = {
  id: 'sample',
  name: 'Sample',
  defaults: { work: 30, rest: 10, restBetweenRounds: 20 },
  items: [
    { kind: 'block', exerciseId: 'jumping-jacks', mode: 'timed', value: 20 },
    {
      kind: 'circuit',
      name: 'Main',
      repeat: 2,
      blocks: [
        { kind: 'block', exerciseId: 'push-up', mode: 'reps', value: 10 },
        { kind: 'block', exerciseId: 'bodyweight-squat', mode: 'timed', value: 15 },
      ],
    },
    { kind: 'block', exerciseId: 'plank', mode: 'timed', value: 30 },
  ],
};

describe('flattenWorkout', () => {
  it('expands rounds and inserts the right rests, with no trailing rest', () => {
    const phases = flattenWorkout(workout);
    // work x5 (jacks, [push-up, squat] x2, plank) + 5 interleaved rests, minus
    // the trailing rest after plank => 11 - 1 = 10... but the after-circuit rest
    // before plank survives, so: 0 jacks,1 rest,2 pushup,3 rest,4 squat,5 rest,
    // 6 pushup,7 rest,8 squat,9 rest,10 plank => 11 phases.
    expect(phases).toHaveLength(11);
    expect(phases[0]).toMatchObject({ type: 'work', exerciseId: 'jumping-jacks', duration: 20 });
    expect(phases[5]).toMatchObject({ type: 'rest', duration: 20, reason: 'between-rounds' });
    expect(phases[9]).toMatchObject({ type: 'rest', duration: 10, reason: 'after-circuit' });
    expect(phases[10]).toMatchObject({ type: 'work', exerciseId: 'plank' });
    expect(phases[phases.length - 1].type).toBe('work');
  });

  it('falls back to defaults.work for a timed block without a value', () => {
    const phases = flattenWorkout({
      ...workout,
      items: [{ kind: 'block', exerciseId: 'plank', mode: 'timed' }],
    });
    expect(phases[0]).toMatchObject({ type: 'work', duration: 30 });
  });
});

describe('WorkoutEngine', () => {
  let engine: WorkoutEngine;
  let state: EngineState;

  beforeEach(() => {
    engine = new WorkoutEngine(workout);
    engine.subscribe((s) => {
      state = s;
    });
    engine.start();
  });

  it('starts on the first work phase with up-next', () => {
    expect(state).toMatchObject({
      status: 'running',
      phase: 'work',
      exerciseId: 'jumping-jacks',
      remaining: 20,
      duration: 20,
      round: 1,
      rounds: 1,
    });
    expect(state.upNext).toEqual({ exerciseId: 'push-up', round: 1, rounds: 2 });
  });

  it('counts a timed block down and auto-advances into rest', () => {
    engine.tick(20);
    expect(state).toMatchObject({
      phase: 'rest',
      remaining: 10,
      restReason: 'between-blocks',
      round: 1,
      rounds: 2, // upcoming push-up is round 1 of 2
    });
    expect(state.upNext).toEqual({ exerciseId: 'push-up', round: 1, rounds: 2 });
  });

  it('carries time overflow across consecutive phases', () => {
    engine.tick(35); // 20s jacks + 10s rest + 5s into push-up (reps -> waits)
    expect(state).toMatchObject({ phase: 'work', exerciseId: 'push-up', mode: 'reps' });
    expect(state.remaining).toBeNull();
  });

  it('waits for a done signal on a reps block', () => {
    engine.tick(30); // through jacks + rest, into push-up
    expect(state).toMatchObject({ exerciseId: 'push-up', remaining: null, repsTarget: 10 });
    engine.tick(100); // time does nothing while a reps block waits
    expect(state.exerciseId).toBe('push-up');
    engine.done();
    expect(state).toMatchObject({ phase: 'rest', restReason: 'between-blocks' });
  });

  it('runs through rounds, showing round x/y and between-round rest', () => {
    engine.tick(30); // -> push-up (r1)
    engine.done(); // -> rest
    engine.tick(10); // -> squat (r1)
    expect(state).toMatchObject({ exerciseId: 'bodyweight-squat', round: 1, rounds: 2 });
    engine.tick(15); // squat done -> between-rounds rest
    expect(state).toMatchObject({ phase: 'rest', restReason: 'between-rounds', round: 2, rounds: 2 });
    engine.tick(20); // -> push-up (r2)
    expect(state).toMatchObject({ exerciseId: 'push-up', round: 2, rounds: 2 });
  });

  it('reaches completion and reports a result', () => {
    engine.tick(20); // jacks -> rest
    engine.tick(10); // rest -> push-up r1
    engine.done(); //   push-up r1 -> rest
    engine.tick(10); // rest -> squat r1
    engine.tick(15); // squat r1 -> between-rounds rest
    engine.tick(20); // rest -> push-up r2
    engine.done(); //   push-up r2 -> rest
    engine.tick(10); // rest -> squat r2
    engine.tick(15); // squat r2 -> after-circuit rest
    engine.tick(10); // rest -> plank
    engine.tick(30); // plank -> complete
    expect(state.status).toBe('completed');
    expect(state.phase).toBeNull();

    const result = engine.getResult();
    expect(result.workoutId).toBe('sample');
    expect(result.completedBlocks.map((b) => b.exerciseId)).toEqual([
      'jumping-jacks',
      'push-up',
      'bodyweight-squat',
      'push-up',
      'bodyweight-squat',
      'plank',
    ]);
    // sum of every timed/rest second actually consumed
    expect(result.durationSeconds).toBe(20 + 10 + 10 + 15 + 20 + 10 + 15 + 10 + 30);
  });

  describe('controls', () => {
    it('pause halts the countdown; resume continues it', () => {
      engine.pause();
      expect(state.status).toBe('paused');
      engine.tick(100); // ignored while paused
      expect(state.remaining).toBe(20);
      engine.resume();
      engine.tick(5);
      expect(state).toMatchObject({ status: 'running', remaining: 15 });
    });

    it('skip jumps to the next phase without recording it', () => {
      engine.skip(); // skip jacks -> rest
      expect(state.phase).toBe('rest');
      engine.skip(); // skip rest -> push-up
      expect(state.exerciseId).toBe('push-up');
      // nothing was completed by skipping
      expect(engine.getResult().completedBlocks).toHaveLength(0);
    });

    it('back returns to the previous work phase', () => {
      engine.tick(20); // -> rest after jacks
      engine.skip(); // -> push-up (r1)
      engine.skip(); // -> rest
      engine.skip(); // -> squat (r1)
      expect(state.exerciseId).toBe('bodyweight-squat');
      engine.back(); // -> previous work = push-up (r1)
      expect(state).toMatchObject({ exerciseId: 'push-up', round: 1, remaining: null });
    });

    it('back on the first phase restarts it', () => {
      engine.tick(8);
      expect(state.remaining).toBe(12);
      engine.back();
      expect(state).toMatchObject({ exerciseId: 'jumping-jacks', remaining: 20 });
    });

    it('addTime extends the current timed phase', () => {
      engine.tick(5); // remaining 15
      engine.addTime(10);
      expect(state).toMatchObject({ remaining: 25, duration: 30 });
    });

    it('addTime is a no-op while a reps block waits', () => {
      engine.tick(30); // -> push-up (reps)
      engine.addTime(10);
      expect(state.remaining).toBeNull();
    });

    it('end stops the workout immediately', () => {
      engine.tick(5);
      engine.end();
      expect(state.status).toBe('completed');
      expect(state.phase).toBeNull();
    });
  });
});

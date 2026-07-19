import { describe, expect, it } from 'vitest';
import { estimateCalories, withEstimatedCalories } from './calories';
import type { CompletedBlock } from './session';
import type { SessionResult } from './session';

const metById: Record<string, number> = {
  'jumping-jacks': 8,
  'bodyweight-squat': 5,
  'push-up': 3.8,
};

describe('estimateCalories', () => {
  it('sums MET x weight x duration(hours) across timed blocks', () => {
    // 20s at MET 8 + 15s at MET 5, 70kg: 8*70*20/3600 + 5*70*15/3600
    const blocks: CompletedBlock[] = [
      { exerciseId: 'jumping-jacks', mode: 'timed', value: 20 },
      { exerciseId: 'bodyweight-squat', mode: 'timed', value: 15 },
    ];
    const kcal = estimateCalories(blocks, 70, (id) => metById[id]);
    const expected = (8 * 70 * (20 / 3600)) + (5 * 70 * (15 / 3600));
    expect(kcal).toBeCloseTo(expected, 6);
  });

  it('estimates duration for reps blocks from a per-rep assumption', () => {
    const blocks: CompletedBlock[] = [
      { exerciseId: 'push-up', mode: 'reps', value: 10 },
    ];
    const kcal = estimateCalories(blocks, 70, (id) => metById[id]);
    expect(kcal).toBeGreaterThan(0);
    // 10 reps * 3s/rep = 30s
    expect(kcal).toBeCloseTo(3.8 * 70 * (30 / 3600), 6);
  });

  it('skips blocks whose exercise has no known MET', () => {
    const blocks: CompletedBlock[] = [{ exerciseId: 'unknown', mode: 'timed', value: 60 }];
    expect(estimateCalories(blocks, 70, () => undefined)).toBe(0);
  });

  it('is plausible for a realistic 10-minute mixed session', () => {
    // ~3 min jacks (MET 8), ~3 min squats (MET 5), 50 reps push-ups (MET 3.8), 80kg.
    const blocks: CompletedBlock[] = [
      { exerciseId: 'jumping-jacks', mode: 'timed', value: 180 },
      { exerciseId: 'bodyweight-squat', mode: 'timed', value: 180 },
      { exerciseId: 'push-up', mode: 'reps', value: 50 },
    ];
    const kcal = estimateCalories(blocks, 80, (id) => metById[id]);
    // Sanity band for a ~10 min moderate-to-vigorous bodyweight session.
    expect(kcal).toBeGreaterThan(30);
    expect(kcal).toBeLessThan(150);
  });
});

describe('withEstimatedCalories', () => {
  it('fills estimatedCalories on the session, rounded to 1 decimal', () => {
    const session: SessionResult = {
      workoutId: 'w1',
      completedBlocks: [{ exerciseId: 'jumping-jacks', mode: 'timed', value: 20 }],
      durationSeconds: 30,
      estimatedCalories: 0,
      timestamp: 1234,
    };
    const result = withEstimatedCalories(session, 70, (id) => metById[id]);
    expect(result.estimatedCalories).toBeCloseTo(8 * 70 * (20 / 3600), 1);
    expect(result.completedBlocks).toBe(session.completedBlocks);
    expect(result.workoutId).toBe('w1');
  });
});

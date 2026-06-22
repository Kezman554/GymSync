import { describe, expect, it } from 'vitest';
import { seedExercises } from './seed';
import { excludeByLoad, filterByEquipment, filterByTarget } from './queries';
import { findSimilar } from './similar';

const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('filterByTarget', () => {
  it('does NOT return mountain climbers for an arm-target search', () => {
    // Mountain climbers train core/hip-flexors (primary) and shoulders/quads
    // (secondary) — no arm muscles, so they must not surface.
    const arms = filterByTarget(seedExercises, ['biceps', 'triceps', 'forearms']);
    expect(ids(arms)).not.toContain('mountain-climbers');
    // sanity: the search itself works (curls are an arm exercise)
    expect(ids(arms)).toContain('dumbbell-bicep-curl');
  });

  it('reads the trains dimension, including secondary by default', () => {
    const back = filterByTarget(seedExercises, 'back');
    expect(ids(back)).toContain('pull-up'); // primary
    expect(ids(back)).toContain('kettlebell-swing'); // secondary mover

    const backPrimaryOnly = filterByTarget(seedExercises, 'back', {
      includeSecondary: false,
    });
    expect(ids(backPrimaryOnly)).toContain('pull-up');
    expect(ids(backPrimaryOnly)).not.toContain('kettlebell-swing');
  });
});

describe('excludeByLoad', () => {
  it('removes mountain climbers when avoiding elbow load', () => {
    // Pre-condition: mountain climbers are in the unfiltered library...
    expect(ids(seedExercises)).toContain('mountain-climbers');
    // ...and they load the elbow (plank-position support), so avoiding elbow
    // load must drop them.
    const safe = excludeByLoad(seedExercises, { joints: ['elbow'] });
    expect(ids(safe)).not.toContain('mountain-climbers');
    // a non-elbow exercise survives
    expect(ids(safe)).toContain('bodyweight-squat');
  });

  it('treats grip as a threshold (this level or higher)', () => {
    const noFirmGrip = excludeByLoad(seedExercises, { grip: 'high' });
    expect(ids(noFirmGrip)).not.toContain('kettlebell-swing'); // high grip
    expect(ids(noFirmGrip)).not.toContain('pull-up'); // high grip
    expect(ids(noFirmGrip)).toContain('push-up'); // light grip survives
  });

  it('excludes by load type', () => {
    const noPlyo = excludeByLoad(seedExercises, { type: ['plyometric'] });
    expect(ids(noPlyo)).not.toContain('box-jump');
    expect(ids(noPlyo)).not.toContain('jumping-jacks');
    expect(ids(noPlyo)).toContain('plank');
  });
});

describe('filterByEquipment', () => {
  it('returns only bodyweight exercises in no-equipment mode', () => {
    const bodyweight = filterByEquipment(seedExercises, []);
    expect(ids(bodyweight)).toContain('bodyweight-squat');
    expect(ids(bodyweight)).not.toContain('dumbbell-bicep-curl');
    expect(ids(bodyweight)).not.toContain('plank'); // needs a mat
  });

  it('includes exercises whose equipment the user has', () => {
    const withDumbbells = filterByEquipment(seedExercises, ['dumbbell', 'mat']);
    expect(ids(withDumbbells)).toContain('dumbbell-row');
    expect(ids(withDumbbells)).toContain('plank');
    expect(ids(withDumbbells)).not.toContain('pull-up'); // needs a bar
  });
});

describe('findSimilar', () => {
  it('returns ranked swaps that exclude the reference exercise', () => {
    const similar = findSimilar(seedExercises, 'bodyweight-squat');
    expect(ids(similar)).not.toContain('bodyweight-squat');
    // box jump shares squat pattern + quads/glutes — should rank near the top
    expect(ids(similar).slice(0, 3)).toContain('box-jump');
  });

  it('can restrict swaps to available equipment', () => {
    const swaps = findSimilar(seedExercises, 'dumbbell-shoulder-press', {
      availableEquipment: [],
    });
    // with no extra kit, every suggestion must be doable with the press's own
    // equipment (dumbbell) or nothing — never a pull-up bar.
    expect(ids(swaps)).not.toContain('pull-up');
  });

  it('returns an empty list for an unknown id', () => {
    expect(findSimilar(seedExercises, 'does-not-exist')).toEqual([]);
  });
});

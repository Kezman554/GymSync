import type { Exercise } from './exercise';
import type { Equipment, GripLoad, Joint, LoadType, MuscleGroup } from './tags';

// Query functions over the tagged library. All exclusion logic is DERIVED from
// positive tags — the library never stores "avoid" flags (see CLAUDE.md).

/**
 * Keep only exercises whose required equipment the user has. `'none'` is always
 * considered available, so passing an empty list yields the no-equipment mode
 * (bodyweight-only) exercises.
 */
export function filterByEquipment(
  exercises: Exercise[],
  available: Equipment[],
): Exercise[] {
  const have = new Set<Equipment>(['none', ...available]);
  return exercises.filter((ex) => ex.equipment.every((e) => have.has(e)));
}

export interface TargetOptions {
  /** Match secondary movers too, not just primary. Defaults to true. */
  includeSecondary?: boolean;
}

/**
 * Keep exercises that train at least one of the target muscle groups. Reads the
 * positive `trains` dimension only.
 */
export function filterByTarget(
  exercises: Exercise[],
  target: MuscleGroup | MuscleGroup[],
  options: TargetOptions = {},
): Exercise[] {
  const wanted = new Set<MuscleGroup>(Array.isArray(target) ? target : [target]);
  const includeSecondary = options.includeSecondary ?? true;
  return exercises.filter((ex) => {
    const muscles = includeSecondary
      ? [...ex.trains.primary, ...ex.trains.secondary]
      : ex.trains.primary;
    return muscles.some((m) => wanted.has(m));
  });
}

/** Ordered grip-demand scale, so a threshold can mean "this level or higher". */
const GRIP_RANK: Record<GripLoad, number> = {
  none: 0,
  light: 1,
  moderate: 2,
  high: 3,
};

export interface LoadExclusion {
  /** Remove exercises that load any of these joints (e.g. ['elbow']). */
  joints?: Joint[];
  /** Remove exercises whose grip demand is at or above this level. */
  grip?: GripLoad;
  /** Remove exercises of any of these load types (e.g. ['plyometric']). */
  type?: LoadType[];
}

/**
 * Remove exercises that match an avoidance criterion, derived entirely from the
 * positive `loads` tags. E.g. `{ joints: ['elbow'] }` drops every exercise that
 * loads the elbow; `{ grip: 'moderate' }` drops anything with moderate-or-higher
 * grip demand.
 */
export function excludeByLoad(
  exercises: Exercise[],
  avoid: LoadExclusion,
): Exercise[] {
  const avoidJoints = new Set<Joint>(avoid.joints ?? []);
  const avoidTypes = new Set<LoadType>(avoid.type ?? []);
  const gripThreshold = avoid.grip != null ? GRIP_RANK[avoid.grip] : null;

  return exercises.filter((ex) => {
    if (ex.loads.joints.some((j) => avoidJoints.has(j))) return false;
    if (avoidTypes.has(ex.loads.type)) return false;
    if (gripThreshold != null && GRIP_RANK[ex.loads.grip] >= gripThreshold) {
      return false;
    }
    return true;
  });
}

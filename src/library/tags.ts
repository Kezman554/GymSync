// Typed tag dimensions for the exercise library.
//
// Convention (see CLAUDE.md): tags are positive, typed dimensions. We keep
// "trains" (what an exercise works) separate from "loads" (what it stresses),
// and we NEVER store exclusions — exclusion filtering is derived from these
// positive tags (e.g. "avoid elbow load" => drop exercises whose loads.joints
// include 'elbow').

/** Muscle groups an exercise trains. */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'hip-flexors'
  | 'adductors'
  | 'abductors'
  | 'full-body';

/** What an exercise trains, split into primary and secondary movers. */
export interface Trains {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
}

/** Joints that bear meaningful load during an exercise. */
export type Joint =
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'spine'
  | 'hip'
  | 'knee'
  | 'ankle';

/** Grip demand — the basis for "avoid grip load" style filters. */
export type GripLoad = 'none' | 'light' | 'moderate' | 'high';

/** The nature of the mechanical load, independent of equipment. */
export type LoadType = 'bodyweight' | 'weighted' | 'plyometric' | 'isometric';

/** How an exercise stresses the body — the basis for exclusion filtering. */
export interface Loads {
  joints: Joint[];
  grip: GripLoad;
  type: LoadType;
}

/** Equipment an exercise requires. 'none' enables the no-equipment mode. */
export type Equipment =
  | 'none'
  | 'mat'
  | 'dumbbell'
  | 'kettlebell'
  | 'barbell'
  | 'band'
  | 'pull-up-bar'
  | 'bench'
  | 'box'
  | 'jump-rope';

/** Joint/landing impact level. */
export type Impact = 'none' | 'low' | 'high';

/** Default body position for the exercise. */
export type Position =
  | 'standing'
  | 'seated'
  | 'kneeling'
  | 'quadruped'
  | 'prone'
  | 'supine'
  | 'plank'
  | 'hanging';

/** Primary movement pattern, for balanced programming. */
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal-push'
  | 'vertical-push'
  | 'horizontal-pull'
  | 'vertical-pull'
  | 'core'
  | 'rotation'
  | 'locomotion'
  | 'isolation';

/** Cardiovascular intensity, for HIIT/cardio programming. */
export type CardioIntensity = 'none' | 'low' | 'moderate' | 'high';

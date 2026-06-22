import type { Exercise } from './exercise';

/**
 * Small typed seed dataset for development (~6 exercises). Covers the three
 * modalities — strength, HIIT, and cardio — and a spread of tag dimensions so
 * library queries and exclusion filters have something to chew on.
 */
export const seedExercises: Exercise[] = [
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    trains: {
      primary: ['quads', 'glutes'],
      secondary: ['hamstrings', 'core'],
    },
    loads: { joints: ['knee', 'hip', 'ankle'], grip: 'none', type: 'bodyweight' },
    equipment: ['none'],
    impact: 'none',
    position: 'standing',
    movementPattern: 'squat',
    cardioIntensity: 'low',
    met: 5.0,
    clip: 'squat',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    trains: {
      primary: ['chest', 'triceps'],
      secondary: ['shoulders', 'core'],
    },
    loads: { joints: ['shoulder', 'elbow', 'wrist'], grip: 'light', type: 'bodyweight' },
    equipment: ['none'],
    impact: 'none',
    position: 'plank',
    movementPattern: 'horizontal-push',
    cardioIntensity: 'low',
    met: 4.0,
    clip: 'push-up',
  },
  {
    id: 'plank',
    name: 'Forearm Plank',
    trains: {
      primary: ['core'],
      secondary: ['shoulders', 'glutes'],
    },
    loads: { joints: ['shoulder', 'spine'], grip: 'none', type: 'isometric' },
    equipment: ['mat'],
    impact: 'none',
    position: 'plank',
    movementPattern: 'core',
    cardioIntensity: 'none',
    met: 3.3,
    clip: 'plank',
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    trains: {
      primary: ['full-body'],
      secondary: ['calves', 'shoulders'],
    },
    loads: { joints: ['ankle', 'knee', 'shoulder'], grip: 'none', type: 'plyometric' },
    equipment: ['none'],
    impact: 'high',
    position: 'standing',
    movementPattern: 'locomotion',
    cardioIntensity: 'high',
    met: 8.0,
    clip: 'jumping-jacks',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    trains: {
      primary: ['core', 'hip-flexors'],
      secondary: ['shoulders', 'quads'],
    },
    loads: { joints: ['shoulder', 'wrist', 'hip'], grip: 'light', type: 'plyometric' },
    equipment: ['none'],
    impact: 'low',
    position: 'plank',
    movementPattern: 'core',
    cardioIntensity: 'high',
    met: 8.0,
    clip: 'mountain-climbers',
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    trains: {
      primary: ['glutes', 'hamstrings'],
      secondary: ['back', 'core', 'forearms'],
    },
    loads: { joints: ['hip', 'spine', 'shoulder'], grip: 'high', type: 'weighted' },
    equipment: ['kettlebell'],
    impact: 'low',
    position: 'standing',
    movementPattern: 'hinge',
    cardioIntensity: 'moderate',
    met: 9.8,
    clip: 'kettlebell-swing',
  },
];

/** Look up a seed exercise by id (convenience for development). */
export const seedExerciseById: Readonly<Record<string, Exercise>> =
  Object.fromEntries(seedExercises.map((ex) => [ex.id, ex]));

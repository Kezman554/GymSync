import { useState } from 'react'
import type { SessionResult, Workout } from '../../engine'
import { WorkoutEngine, withEstimatedCalories } from '../../engine'
import { seedExercises } from '../../library'
import { loadProfile } from '../../db/profile'

// Drives an engine deterministically to completion: consumes each timed
// phase's remaining time in one tick, and marks reps phases done immediately.
// Used to exercise the full session -> calorie-estimate path without a real
// clock or a play-through UI.
function runToCompletion(workout: Workout): SessionResult {
  const engine = new WorkoutEngine(workout)
  engine.start()
  let state = engine.getState()
  let guard = 0
  while (state.status !== 'completed' && guard < 10_000) {
    if (state.remaining != null) {
      engine.tick(state.remaining + 0.001)
    } else if (state.phase === 'work') {
      engine.done()
    } else {
      engine.skip()
    }
    state = engine.getState()
    guard += 1
  }
  return engine.getResult()
}

const metById = new Map(seedExercises.map((ex) => [ex.id, ex.met]))

interface Props {
  buildWorkout: () => Workout
}

export default function RunSampleSession({ buildWorkout }: Props) {
  const [result, setResult] = useState<SessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    try {
      const workout = buildWorkout()
      if (workout.items.length === 0) {
        throw new Error('Build a workout with at least one block first.')
      }
      const session = runToCompletion(workout)
      const profile = await loadProfile()
      const weightKg = profile?.weightKg ?? 70
      const withCalories = withEstimatedCalories(session, weightKg, (id) => metById.get(id))
      setResult(withCalories)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setResult(null)
    }
  }

  return (
    <section className="panel">
      <h2>Run sample session</h2>
      <p className="muted">
        Fast-forwards the current workout through the engine and shows the
        estimated calorie burn, using your saved profile weight (defaults to
        70kg if none is saved).
      </p>
      <button type="button" onClick={handleRun}>Run current workout</button>
      {error && <p className="muted">{error}</p>}
      {result && (
        <div className="session-summary">
          <p>Duration: {result.durationSeconds}s</p>
          <p>Blocks completed: {result.completedBlocks.length}</p>
          <p className="kcal">Estimated burn: {result.estimatedCalories} kcal</p>
        </div>
      )}
    </section>
  )
}

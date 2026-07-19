import { useEffect, useMemo, useState } from 'react'
import type { EngineState, SessionResult, Workout } from '../../engine'
import { WorkoutEngine, withEstimatedCalories } from '../../engine'
import { seedExercises } from '../../library'
import { loadProfile } from '../../db/profile'

const exerciseNameById = new Map(seedExercises.map((ex) => [ex.id, ex.name]))
const metById = new Map(seedExercises.map((ex) => [ex.id, ex.met]))

function exerciseName(id: string | null): string {
  if (!id) return '—'
  return exerciseNameById.get(id) ?? id
}

interface Props {
  workout: Workout
  onExit: () => void
}

/** Runs a workout live through the engine (real ticking clock) with remote
 * controls, and shows an estimated-calorie summary once it completes. */
export default function SessionPlayer({ workout, onExit }: Props) {
  const engine = useMemo(
    () => new WorkoutEngine(workout, { tickIntervalMs: 1000 }),
    [workout],
  )
  const [state, setState] = useState<EngineState>(() => engine.getState())
  const [result, setResult] = useState<SessionResult | null>(null)

  useEffect(() => {
    const unsubscribe = engine.subscribe(setState)
    engine.start()
    return () => {
      unsubscribe()
      engine.end()
    }
  }, [engine])

  useEffect(() => {
    if (state.status !== 'completed' || result) return
    let cancelled = false
    void (async () => {
      const session = engine.getResult()
      const profile = await loadProfile()
      const weightKg = profile?.weightKg ?? 70
      const withCalories = withEstimatedCalories(session, weightKg, (id) => metById.get(id))
      if (!cancelled) setResult(withCalories)
    })()
    return () => {
      cancelled = true
    }
  }, [state.status, engine, result])

  if (state.status === 'completed') {
    return (
      <section className="panel session-player">
        <h2>Session complete</h2>
        {result && (
          <div className="session-summary">
            <p>Duration: {result.durationSeconds}s</p>
            <p>Blocks completed: {result.completedBlocks.length}</p>
            <p className="kcal">Estimated burn: {result.estimatedCalories} kcal</p>
          </div>
        )}
        <button type="button" onClick={onExit}>Back to builder</button>
      </section>
    )
  }

  const remaining = state.remaining != null ? Math.ceil(state.remaining) : null
  const isRest = state.phase === 'rest'
  const isReps = state.phase === 'work' && state.mode === 'reps'

  return (
    <section className="panel session-player">
      <p className="muted">{workout.name}</p>

      <h2 className="session-phase">{isRest ? 'REST' : exerciseName(state.exerciseId)}</h2>
      {!isRest && state.circuitName && <p className="muted">{state.circuitName}</p>}

      <div className="session-clock">
        {remaining != null ? `${remaining}s` : isReps ? `${state.repsTarget ?? '?'} reps` : ''}
      </div>

      {state.rounds > 1 && <p className="muted">Round {state.round} / {state.rounds}</p>}

      <p className="muted">Up next: {exerciseName(state.upNext?.exerciseId ?? null)}</p>

      {isReps && (
        <button type="button" className="done-button" onClick={() => engine.done()}>
          Done
        </button>
      )}

      <div className="session-controls">
        {state.status === 'running' ? (
          <button type="button" onClick={() => engine.pause()}>Pause</button>
        ) : (
          <button type="button" onClick={() => engine.resume()}>Resume</button>
        )}
        <button type="button" onClick={() => engine.skip()}>Skip</button>
        <button type="button" onClick={() => engine.back()}>Back</button>
        <button type="button" onClick={() => engine.addTime(10)}>+10s</button>
        <button type="button" onClick={() => engine.end()}>End</button>
      </div>
    </section>
  )
}

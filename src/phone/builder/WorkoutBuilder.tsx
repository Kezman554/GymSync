import { useMemo, useState } from 'react'
import type { Block, BlockMode, TimingDefaults, Workout, WorkoutItem } from '../../engine'
import { flattenWorkout } from '../../engine'
import { seedExercises } from '../../library'
import BlockList from './BlockList'
import LibraryBrowser from './LibraryBrowser'
import RunSampleSession from '../session/RunSampleSession'
import TemplatePanel from './TemplatePanel'
import TimingPanel from './TimingPanel'
import { newLocalId, type BuilderBlock } from './types'

const DEFAULT_TIMING: TimingDefaults = { work: 30, rest: 15, restBetweenRounds: 30 }

export default function WorkoutBuilder() {
  const [workoutId, setWorkoutId] = useState(newLocalId)
  const [name, setName] = useState('My Workout')
  const [defaults, setDefaults] = useState<TimingDefaults>(DEFAULT_TIMING)
  const [blocks, setBlocks] = useState<BuilderBlock[]>([])
  const [validation, setValidation] = useState<string | null>(null)

  const exercisesById = useMemo(
    () => new Map(seedExercises.map((ex) => [ex.id, ex])),
    [],
  )

  const addBlock = (exerciseId: string) => {
    const block: Block = { kind: 'block', exerciseId, mode: 'timed' }
    setBlocks((cur) => [...cur, { localId: newLocalId(), block }])
    setValidation(null)
  }

  const moveBlock = (localId: string, direction: -1 | 1) => {
    setBlocks((cur) => {
      const i = cur.findIndex((b) => b.localId === localId)
      const j = i + direction
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const next = [...cur]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const removeBlock = (localId: string) => {
    setBlocks((cur) => cur.filter((b) => b.localId !== localId))
  }

  const duplicateBlock = (localId: string) => {
    setBlocks((cur) => {
      const i = cur.findIndex((b) => b.localId === localId)
      if (i < 0) return cur
      const copy: BuilderBlock = { localId: newLocalId(), block: { ...cur[i].block } }
      return [...cur.slice(0, i + 1), copy, ...cur.slice(i + 1)]
    })
  }

  const patchBlock = (localId: string, patch: Partial<Block>) => {
    setBlocks((cur) =>
      cur.map((b) => (b.localId === localId ? { ...b, block: { ...b.block, ...patch } } : b)),
    )
  }

  const onModeChange = (localId: string, mode: BlockMode) => patchBlock(localId, { mode })
  const onValueChange = (localId: string, value: number | undefined) =>
    patchBlock(localId, { value })
  const onRestAfterChange = (localId: string, restAfter: number | undefined) =>
    patchBlock(localId, { restAfter })

  const buildWorkout = (): Workout => ({
    id: workoutId,
    name,
    defaults,
    items: blocks.map((b): WorkoutItem => b.block),
  })

  const loadWorkout = (workout: Workout) => {
    setWorkoutId(workout.id)
    setName(workout.name)
    setDefaults(workout.defaults)
    setBlocks(
      workout.items.map((item) => ({ localId: newLocalId(), block: item as Block })),
    )
    setValidation(`Loaded "${workout.name}".`)
  }

  const handleTest = () => {
    try {
      const workout = buildWorkout()
      if (!workout.name.trim()) throw new Error('Workout needs a name.')
      if (workout.items.length === 0) throw new Error('Add at least one block.')
      const phases = flattenWorkout(workout)
      const workPhases = phases.filter((p) => p.type === 'work').length
      console.log('Serialised workout:', workout)
      console.log('Flattened timeline:', phases)
      setValidation(
        `Valid Workout — ${workout.items.length} block(s), ${workPhases} work phase(s), ` +
          `${phases.length} total timeline entries. Logged to console.`,
      )
    } catch (err) {
      setValidation(`Invalid: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="builder">
      <section className="panel">
        <h2>Workout details</h2>
        <label className="inline-field">
          name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </section>

      <TimingPanel defaults={defaults} onChange={setDefaults} />

      <BlockList
        blocks={blocks}
        exercisesById={exercisesById}
        defaultWork={defaults.work}
        defaultRest={defaults.rest}
        onMove={moveBlock}
        onRemove={removeBlock}
        onDuplicate={duplicateBlock}
        onModeChange={onModeChange}
        onValueChange={onValueChange}
        onRestAfterChange={onRestAfterChange}
      />

      <LibraryBrowser onAdd={addBlock} />

      <section className="panel">
        <button type="button" onClick={handleTest}>Validate &amp; serialise</button>
        {validation && <p className="muted">{validation}</p>}
      </section>

      <RunSampleSession buildWorkout={buildWorkout} />

      <TemplatePanel buildWorkout={buildWorkout} onLoad={loadWorkout} />
    </div>
  )
}

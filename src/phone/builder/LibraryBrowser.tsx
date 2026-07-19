import { useMemo, useState } from 'react'
import type { Equipment, Exercise, GripLoad, Joint, LoadType, MuscleGroup } from '../../library'
import { excludeByLoad, filterByEquipment, filterByTarget, seedExercises } from '../../library'

const EQUIPMENT_OPTIONS: Equipment[] = [
  'mat', 'dumbbell', 'kettlebell', 'barbell', 'band', 'pull-up-bar', 'bench', 'box', 'jump-rope',
]

const MUSCLE_OPTIONS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core',
  'glutes', 'quads', 'hamstrings', 'calves', 'hip-flexors', 'adductors',
  'abductors', 'full-body',
]

const JOINT_OPTIONS: Joint[] = ['shoulder', 'elbow', 'wrist', 'spine', 'hip', 'knee', 'ankle']
const GRIP_OPTIONS: GripLoad[] = ['light', 'moderate', 'high']
const LOAD_TYPE_OPTIONS: LoadType[] = ['bodyweight', 'weighted', 'plyometric', 'isometric']

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

interface Props {
  onAdd: (exerciseId: string) => void
}

export default function LibraryBrowser({ onAdd }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [noKitMode, setNoKitMode] = useState(false)
  const [target, setTarget] = useState<MuscleGroup[]>([])
  const [avoidJoints, setAvoidJoints] = useState<Joint[]>([])
  const [avoidGrip, setAvoidGrip] = useState<GripLoad | ''>('')
  const [avoidTypes, setAvoidTypes] = useState<LoadType[]>([])

  const results = useMemo<Exercise[]>(() => {
    let list = seedExercises
    if (noKitMode) {
      list = filterByEquipment(list, [])
    } else if (equipment.length > 0) {
      list = filterByEquipment(list, equipment)
    }
    if (target.length > 0) {
      list = filterByTarget(list, target)
    }
    if (avoidJoints.length > 0 || avoidGrip || avoidTypes.length > 0) {
      list = excludeByLoad(list, {
        joints: avoidJoints.length > 0 ? avoidJoints : undefined,
        grip: avoidGrip || undefined,
        type: avoidTypes.length > 0 ? avoidTypes : undefined,
      })
    }
    return list
  }, [equipment, noKitMode, target, avoidJoints, avoidGrip, avoidTypes])

  return (
    <section className="panel">
      <h2>Library</h2>

      <label className="row">
        <input
          type="checkbox"
          checked={noKitMode}
          onChange={(e) => setNoKitMode(e.target.checked)}
        />
        No-equipment mode
      </label>

      <fieldset disabled={noKitMode}>
        <legend>Equipment I have</legend>
        <div className="chip-row">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              type="button"
              className={`chip ${equipment.includes(eq) ? 'chip-on' : ''}`}
              onClick={() => setEquipment((cur) => toggle(cur, eq))}
            >
              {eq}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Target muscles</legend>
        <div className="chip-row">
          {MUSCLE_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${target.includes(m) ? 'chip-on' : ''}`}
              onClick={() => setTarget((cur) => toggle(cur, m))}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Avoid joint load</legend>
        <div className="chip-row">
          {JOINT_OPTIONS.map((j) => (
            <button
              key={j}
              type="button"
              className={`chip ${avoidJoints.includes(j) ? 'chip-off' : ''}`}
              onClick={() => setAvoidJoints((cur) => toggle(cur, j))}
            >
              {j}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Avoid grip demand (at or above)</legend>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${avoidGrip === '' ? 'chip-on' : ''}`}
            onClick={() => setAvoidGrip('')}
          >
            any
          </button>
          {GRIP_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${avoidGrip === g ? 'chip-off' : ''}`}
              onClick={() => setAvoidGrip(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Avoid load type</legend>
        <div className="chip-row">
          {LOAD_TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${avoidTypes.includes(t) ? 'chip-off' : ''}`}
              onClick={() => setAvoidTypes((cur) => toggle(cur, t))}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <ul className="exercise-list">
        {results.map((ex) => (
          <li key={ex.id} className="exercise-row">
            <span>{ex.name}</span>
            <button type="button" onClick={() => onAdd(ex.id)}>Add</button>
          </li>
        ))}
        {results.length === 0 && <li className="muted">No exercises match these filters.</li>}
      </ul>
    </section>
  )
}

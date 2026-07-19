import type { BlockMode } from '../../engine'
import type { Exercise } from '../../library'
import type { BuilderBlock } from './types'

interface Props {
  blocks: BuilderBlock[]
  exercisesById: Map<string, Exercise>
  defaultWork: number
  defaultRest: number
  onMove: (localId: string, direction: -1 | 1) => void
  onRemove: (localId: string) => void
  onDuplicate: (localId: string) => void
  onModeChange: (localId: string, mode: BlockMode) => void
  onValueChange: (localId: string, value: number | undefined) => void
  onRestAfterChange: (localId: string, restAfter: number | undefined) => void
}

export default function BlockList({
  blocks,
  exercisesById,
  defaultWork,
  defaultRest,
  onMove,
  onRemove,
  onDuplicate,
  onModeChange,
  onValueChange,
  onRestAfterChange,
}: Props) {
  return (
    <section className="panel">
      <h2>Workout ({blocks.length} block{blocks.length === 1 ? '' : 's'})</h2>
      {blocks.length === 0 && <p className="muted">Add exercises from the library below.</p>}
      <ol className="block-list">
        {blocks.map(({ localId, block }, i) => {
          const exercise = exercisesById.get(block.exerciseId)
          return (
            <li key={localId} className="block-row">
              <div className="block-row-main">
                <span className="block-index">{i + 1}</span>
                <span className="block-name">{exercise?.name ?? block.exerciseId}</span>
              </div>

              <div className="block-row-controls">
                <select
                  value={block.mode}
                  onChange={(e) => onModeChange(localId, e.target.value as BlockMode)}
                >
                  <option value="timed">timed</option>
                  <option value="reps">reps</option>
                </select>

                <label className="inline-field">
                  {block.mode === 'timed' ? `sec (default ${defaultWork})` : 'reps'}
                  <input
                    type="number"
                    min={0}
                    placeholder={block.mode === 'timed' ? String(defaultWork) : ''}
                    value={block.value ?? ''}
                    onChange={(e) =>
                      onValueChange(
                        localId,
                        e.target.value === '' ? undefined : Number(e.target.value),
                      )
                    }
                  />
                </label>

                <label className="inline-field">
                  {`rest after (default ${defaultRest})`}
                  <input
                    type="number"
                    min={0}
                    placeholder={String(defaultRest)}
                    value={block.restAfter ?? ''}
                    onChange={(e) =>
                      onRestAfterChange(
                        localId,
                        e.target.value === '' ? undefined : Number(e.target.value),
                      )
                    }
                  />
                </label>
              </div>

              <div className="block-row-actions">
                <button type="button" onClick={() => onMove(localId, -1)} disabled={i === 0}>up</button>
                <button type="button" onClick={() => onMove(localId, 1)} disabled={i === blocks.length - 1}>down</button>
                <button type="button" onClick={() => onDuplicate(localId)}>duplicate</button>
                <button type="button" onClick={() => onRemove(localId)}>remove</button>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

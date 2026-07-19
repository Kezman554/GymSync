import type { TimingDefaults } from '../../engine'

interface Props {
  defaults: TimingDefaults
  onChange: (defaults: TimingDefaults) => void
}

export default function TimingPanel({ defaults, onChange }: Props) {
  const set = (patch: Partial<TimingDefaults>) => onChange({ ...defaults, ...patch })

  return (
    <section className="panel">
      <h2>Global timing</h2>
      <div className="timing-row">
        <label className="inline-field">
          work (sec)
          <input
            type="number"
            min={0}
            value={defaults.work}
            onChange={(e) => set({ work: Number(e.target.value) })}
          />
        </label>
        <label className="inline-field">
          rest (sec)
          <input
            type="number"
            min={0}
            value={defaults.rest}
            onChange={(e) => set({ rest: Number(e.target.value) })}
          />
        </label>
        <label className="inline-field">
          rest between rounds (sec)
          <input
            type="number"
            min={0}
            value={defaults.restBetweenRounds}
            onChange={(e) => set({ restBetweenRounds: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="muted">
        Per-block work/rest overrides are set on each block below; blocks that
        leave them blank fall back to these defaults.
      </p>
    </section>
  )
}

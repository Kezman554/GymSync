import { useEffect, useState } from 'react'
import type { Workout } from '../../engine'
import { deleteTemplate, listTemplates, saveTemplate } from '../../db/templates'

interface Props {
  buildWorkout: () => Workout
  onLoad: (workout: Workout) => void
}

export default function TemplatePanel({ buildWorkout, onLoad }: Props) {
  const [templates, setTemplates] = useState<Workout[]>([])
  const [status, setStatus] = useState<string | null>(null)

  const refresh = () => {
    listTemplates()
      .then(setTemplates)
      .catch((err) => setStatus(`Couldn't load templates: ${String(err)}`))
  }

  useEffect(refresh, [])

  const handleSave = async () => {
    try {
      const workout = buildWorkout()
      await saveTemplate(workout)
      setStatus(`Saved "${workout.name}".`)
      refresh()
    } catch (err) {
      setStatus(`Save failed: ${String(err)}`)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteTemplate(id)
    refresh()
  }

  return (
    <section className="panel">
      <h2>Templates</h2>
      <button type="button" onClick={handleSave}>Save as named template</button>
      {status && <p className="muted">{status}</p>}

      <ul className="template-list">
        {templates.map((t) => (
          <li key={t.id} className="template-row">
            <span>{t.name}</span>
            <div>
              <button type="button" onClick={() => onLoad(t)}>Load</button>
              <button type="button" onClick={() => handleDelete(t.id)}>Delete</button>
            </div>
          </li>
        ))}
        {templates.length === 0 && <li className="muted">No saved templates yet.</li>}
      </ul>
    </section>
  )
}

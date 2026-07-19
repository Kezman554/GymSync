import { useEffect, useState } from 'react'
import { loadProfile, saveProfile } from '../../db/profile'
import type { Profile } from '../../db/profile'

const DEFAULT_PROFILE: Profile = { age: 30, sex: 'female', weightKg: 65 }

interface Props {
  onSaved?: (profile: Profile) => void
}

export default function ProfileForm({ onSaved }: Props) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    loadProfile().then((saved) => {
      if (saved) setProfile(saved)
    })
  }, [])

  const set = (patch: Partial<Profile>) => setProfile((cur) => ({ ...cur, ...patch }))

  const handleSave = async () => {
    await saveProfile(profile)
    setStatus('Profile saved.')
    onSaved?.(profile)
  }

  return (
    <section className="panel">
      <h2>Profile</h2>
      <div className="field-row">
        <label className="inline-field">
          age
          <input
            type="number"
            min={0}
            value={profile.age}
            onChange={(e) => set({ age: Number(e.target.value) })}
          />
        </label>
        <label className="inline-field">
          sex
          <select
            value={profile.sex}
            onChange={(e) => set({ sex: e.target.value as Profile['sex'] })}
          >
            <option value="female">female</option>
            <option value="male">male</option>
          </select>
        </label>
        <label className="inline-field">
          weight (kg)
          <input
            type="number"
            min={0}
            value={profile.weightKg}
            onChange={(e) => set({ weightKg: Number(e.target.value) })}
          />
        </label>
      </div>
      <button type="button" onClick={handleSave}>Save profile</button>
      {status && <p className="muted">{status}</p>}
    </section>
  )
}

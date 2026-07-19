import { useState } from 'react'
import type { Workout } from '../engine'
import WorkoutBuilder from './builder/WorkoutBuilder'
import ProfileForm from './profile/ProfileForm'
import SessionPlayer from './session/SessionPlayer'

export default function PhoneScreen() {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)

  return (
    <main className="phone-screen">
      <span className="tag">Phone</span>
      <h1>GymSync</h1>
      {activeWorkout ? (
        <div className="builder">
          <SessionPlayer workout={activeWorkout} onExit={() => setActiveWorkout(null)} />
        </div>
      ) : (
        <>
          <div className="builder">
            <ProfileForm />
          </div>
          <WorkoutBuilder onPlay={setActiveWorkout} />
        </>
      )}
    </main>
  )
}

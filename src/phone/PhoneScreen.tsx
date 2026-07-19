import WorkoutBuilder from './builder/WorkoutBuilder'

export default function PhoneScreen() {
  return (
    <main className="phone-screen">
      <span className="tag">Phone</span>
      <h1>GymSync</h1>
      <WorkoutBuilder />
    </main>
  )
}

import WorkoutBuilder from './builder/WorkoutBuilder'
import ProfileForm from './profile/ProfileForm'

export default function PhoneScreen() {
  return (
    <main className="phone-screen">
      <span className="tag">Phone</span>
      <h1>GymSync</h1>
      <div className="builder">
        <ProfileForm />
      </div>
      <WorkoutBuilder />
    </main>
  )
}

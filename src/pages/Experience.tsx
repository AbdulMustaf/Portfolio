import ExperienceTimeline from '../components/ExperienceTimeline'
import AwardsSection from '../components/AwardsSection'
import Footer from '../components/Footer'

export default function Experience() {
  return (
    <main className="bg-netflix-dark min-h-screen pt-[var(--nav-height)]">
      <div className="max-w-7xl mx-auto">
        <ExperienceTimeline />
        <AwardsSection />
      </div>
      <Footer />
    </main>
  )
}

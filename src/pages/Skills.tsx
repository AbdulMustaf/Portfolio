import SkillsGrid from '../components/SkillsGrid'
import Footer from '../components/Footer'

export default function Skills() {
  return (
    <main className="bg-netflix-dark min-h-screen pt-[var(--nav-height)]">
      <div className="max-w-7xl mx-auto">
        <SkillsGrid />
      </div>
      <Footer />
    </main>
  )
}

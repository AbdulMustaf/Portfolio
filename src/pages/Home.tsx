import HeroBanner from '../components/HeroBanner'
import AboutSection from '../components/AboutSection'
import ContentRow from '../components/ContentRow'
import ExperienceTimeline from '../components/ExperienceTimeline'
import SkillsGrid from '../components/SkillsGrid'
import AwardsSection from '../components/AwardsSection'
import ContactButtons from '../components/ContactButtons'
import Footer from '../components/Footer'
import { projectsData } from '../data/projectsData'

const featuredProjects = projectsData.filter((p) => p.featured)
const allProjects = projectsData

export default function Home() {
  return (
    <main className="bg-netflix-dark min-h-screen">
      <HeroBanner />

      <div className="max-w-7xl mx-auto">
        <AboutSection />

        <section id="projects" className="pt-4">
          <ContentRow
            title="🎬 Featured Projects"
            projects={featuredProjects}
          />
          <ContentRow
            title="📁 All Projects"
            projects={allProjects}
          />
        </section>

        <ExperienceTimeline />
        <SkillsGrid />
        <AwardsSection />
        <ContactButtons />
      </div>

      <Footer />
    </main>
  )
}

import ContentRow from '../components/ContentRow'
import Footer from '../components/Footer'
import { projectsData } from '../data/projectsData'

const featuredProjects = projectsData.filter((p) => p.featured)

export default function Projects() {
  return (
    <main className="bg-netflix-dark min-h-screen pt-[var(--nav-height)]">
      <div className="max-w-7xl mx-auto py-4">
        <ContentRow title="🎬 Featured Projects" projects={featuredProjects} />
        <ContentRow title="📁 All Projects" projects={projectsData} />
      </div>
      <Footer />
    </main>
  )
}

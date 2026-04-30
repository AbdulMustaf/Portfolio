import SkillsGrid from '../components/SkillsGrid'
import KnowledgeGraph from '../components/KnowledgeGraph'
import Footer from '../components/Footer'

export default function Skills() {
  return (
    <main className="bg-netflix-dark min-h-screen">
      <KnowledgeGraph />
      <SkillsGrid />
      <Footer />
    </main>
  )
}

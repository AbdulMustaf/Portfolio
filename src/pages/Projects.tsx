import {
  FaPython, FaReact, FaDocker, FaGithub, FaCode,
} from 'react-icons/fa'
import {
  SiFlask, SiPytorch, SiNodedotjs,
} from 'react-icons/si'
import { projectsData } from '../data/projectsData'
import Footer from '../components/Footer'
import type { ReactNode } from 'react'

// Tech badge icon map — expand as needed
const TECH_ICONS: Record<string, ReactNode> = {
  Python:             <FaPython />,
  Flask:              <SiFlask />,
  React:              <FaReact />,
  PyTorch:            <SiPytorch />,
  'Node.js':          <SiNodedotjs />,
  Docker:             <FaDocker />,
  GitHub:             <FaGithub />,
  NLP:                <FaCode />,
  AI:                 <FaCode />,
  LLM:                <FaCode />,
  Azure:              <FaCode />,
  ML:                 <FaCode />,
  'Computer Vision':  <FaCode />,
  'Product Design':   <FaCode />,
  UX:                 <FaCode />,
  'Government Tech':  <FaCode />,
  Strategy:           <FaCode />,
  Research:           <FaCode />,
  'Data Pipelines':   <FaCode />,
  'Product Management': <FaCode />,
}

export default function Projects() {
  return (
    <main className="bg-netflix-dark min-h-screen">
      <div className="projects-container">
        <div className="projects-grid">
          {projectsData.map((project, index) => (
            <div
              key={project.id}
              className="project-card"
              style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
            >
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  className="project-image"
                  onError={(e) => {
                    // Swap to gradient placeholder if image missing
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const sib = target.nextElementSibling as HTMLElement | null
                    if (sib) sib.style.display = 'flex'
                  }}
                />
              ) : null}
              {/* Gradient fallback shown when image fails or is absent */}
              <div
                className="project-image-fallback"
                style={{ display: project.image ? 'none' : 'flex' }}
              >
                <span className="text-netflix-red text-4xl font-black opacity-30">
                  {project.title.charAt(0)}
                </span>
              </div>

              <div className="project-details">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tech-used">
                  {project.tags.map((tech) => (
                    <span key={tech} className="tech-badge">
                      {TECH_ICONS[tech] ?? '🔧'} {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}

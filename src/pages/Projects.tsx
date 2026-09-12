import { useEffect, useState, type ReactNode } from 'react'
import {
  FaPython, FaReact, FaDocker, FaGithub, FaCode, FaExpand, FaTimes,
} from 'react-icons/fa'
import {
  SiFlask, SiPytorch, SiNodedotjs,
} from 'react-icons/si'
import { projectsData, type Project } from '../data/projectsData'
import Footer from '../components/Footer'

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
  // The architecture diagrams carry real module names and metrics, so they need
  // a full-size view — at card width only the title and headline numbers read.
  const [zoomed, setZoomed] = useState<Project | null>(null)

  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])

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
                <button
                  type="button"
                  className="project-figure"
                  onClick={() => setZoomed(project)}
                  aria-label={`Open the ${project.title} architecture diagram full size`}
                >
                  <img
                    src={project.image}
                    alt={`${project.title} system architecture diagram`}
                    className="project-image"
                    onError={(e) => {
                      // Swap to gradient placeholder if image missing
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const sib = target.nextElementSibling as HTMLElement | null
                      if (sib) sib.style.display = 'flex'
                    }}
                  />
                  {/* Gradient fallback shown when the diagram fails to load */}
                  <div className="project-image-fallback" style={{ display: 'none' }}>
                    <span className="text-netflix-red text-4xl font-black opacity-30">
                      {project.title.charAt(0)}
                    </span>
                  </div>
                  <span className="project-figure-hint">
                    <FaExpand size={10} /> View architecture
                  </span>
                </button>
              ) : (
                <div className="project-image-fallback" style={{ display: 'flex' }}>
                  <span className="text-netflix-red text-4xl font-black opacity-30">
                    {project.title.charAt(0)}
                  </span>
                </div>
              )}

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

      {zoomed && (
        <div
          className="diagram-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${zoomed.title} architecture diagram`}
          onClick={() => setZoomed(null)}
        >
          <button
            type="button"
            className="diagram-lightbox-close"
            onClick={() => setZoomed(null)}
            aria-label="Close diagram"
          >
            <FaTimes size={15} />
          </button>
          <img
            src={zoomed.image}
            alt={`${zoomed.title} system architecture diagram`}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="diagram-lightbox-caption">
            <strong>{zoomed.title}</strong>
            {zoomed.subtitle}
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}

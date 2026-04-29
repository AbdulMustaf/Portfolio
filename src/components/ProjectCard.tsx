import { useState } from 'react'
import { FaGithub, FaExternalLinkAlt, FaTimes, FaPlay } from 'react-icons/fa'
import type { Project } from '../data/projectsData'

interface Props {
  project: Project
}

export default function ProjectCard({ project }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      {/* Card */}
      <article
        className="relative flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
        style={{ width: 'clamp(180px, 22vw, 280px)', aspectRatio: '16/9' }}
        onClick={() => setExpanded(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(true)}
        aria-label={`View project: ${project.title}`}
      >
        {/* Thumbnail */}
        <div className="w-full h-full bg-netflix-dark-3 flex items-end">
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, #1a1a2e, #${Math.abs(project.id.charCodeAt(0) * 12345).toString(16).slice(0, 6).padEnd(6, '3')})`,
              }}
            >
              <span className="text-4xl font-black text-white/20 tracking-tighter select-none">
                {project.title.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
          <h3 className="text-white font-bold text-sm leading-tight truncate">{project.title}</h3>
          <p className="text-text-secondary text-xs mt-0.5 truncate">{project.subtitle}</p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-netflix-red/80 text-white px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Play icon center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20">
            <FaPlay className="text-white" size={14} />
          </div>
        </div>
      </article>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative bg-netflix-dark-2 rounded-xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header image */}
            <div className="relative aspect-video bg-netflix-dark-3">
              {project.image ? (
                <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}
                >
                  <span className="text-6xl font-black text-white/20 tracking-tighter">
                    {project.title.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-3 right-3 bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition-colors"
                aria-label="Close"
              >
                <FaTimes size={14} />
              </button>
              {project.featured && (
                <span className="absolute top-3 left-3 bg-netflix-red text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                  Featured
                </span>
              )}
            </div>

            {/* Modal content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-white text-xl font-bold">{project.title}</h2>
                  <p className="text-netflix-red text-sm mt-0.5">{project.subtitle}</p>
                </div>
                <span className="text-text-secondary text-sm flex-shrink-0">{project.year}</span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed mb-4">
                {project.longDescription}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-netflix-dark-3 text-text-secondary px-2 py-1 rounded border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2 rounded hover:bg-opacity-80 transition-all"
                  >
                    <FaGithub size={14} />
                    GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-netflix-dark-3 text-white text-sm font-semibold px-4 py-2 rounded hover:bg-opacity-60 transition-all border border-white/20"
                  >
                    <FaExternalLinkAlt size={12} />
                    Live
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

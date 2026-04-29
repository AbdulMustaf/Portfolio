import { useRef } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import type { Project } from '../data/projectsData'
import ProjectCard from './ProjectCard'

interface Props {
  title: string
  projects: Project[]
  id?: string
}

export default function ContentRow({ title, projects, id }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <section id={id} className="py-6 px-4 sm:px-6 lg:px-10 relative group/row">
      <h2 className="section-title mb-4">{title}</h2>

      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 -translate-x-2 opacity-0 group-hover/row:opacity-100 transition-all duration-200 focus:opacity-100"
          aria-label="Scroll left"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Cards track */}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto pb-3 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 translate-x-2 opacity-0 group-hover/row:opacity-100 transition-all duration-200 focus:opacity-100"
          aria-label="Scroll right"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    </section>
  )
}

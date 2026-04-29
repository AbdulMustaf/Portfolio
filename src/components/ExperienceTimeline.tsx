import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaBriefcase, FaFlask } from 'react-icons/fa'
import { experienceData } from '../data/experienceData'

gsap.registerPlugin(ScrollTrigger)

const typeIcon = (type: string) => {
  if (type === 'Research') return <FaFlask className="text-netflix-red" size={16} />
  return <FaBriefcase className="text-netflix-red" size={16} />
}

export default function ExperienceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.exp-card', {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="experience" ref={containerRef} className="py-10 px-4 sm:px-6 lg:px-10">
      <h2 className="section-title">Experience</h2>
      <p className="text-text-secondary text-sm mb-8">— Episodes in the story so far</p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-netflix-dark-3 hidden sm:block" />

        <div className="flex flex-col gap-6">
          {experienceData.map((exp, i) => (
            <div
              key={exp.id}
              className="exp-card relative sm:pl-16 bg-netflix-dark-2 rounded-xl p-6 border border-white/5 hover:border-netflix-red/30 transition-colors duration-300"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-6 w-12 h-12 bg-netflix-dark-3 border-2 border-netflix-red rounded-full items-center justify-center hidden sm:flex">
                {typeIcon(exp.type)}
              </div>

              {/* Episode number badge */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-netflix-red text-xs font-bold uppercase tracking-widest">
                  Episode {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-text-secondary text-xs">·</span>
                <span className="text-text-secondary text-xs uppercase tracking-wide">{exp.type}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-white text-lg font-bold leading-tight">{exp.role}</h3>
                  <p className="text-netflix-red text-sm font-medium">{exp.orgFull}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-text-secondary text-xs">{exp.dates}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{exp.location}</p>
                </div>
              </div>

              <p className="text-text-primary text-sm leading-relaxed mb-4">{exp.description}</p>

              <ul className="space-y-1.5 mb-4">
                {exp.highlights.map((h, j) => (
                  <li key={j} className="flex gap-2 text-sm text-text-secondary">
                    <span className="text-netflix-red flex-shrink-0 mt-0.5">›</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-1.5">
                {exp.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-netflix-dark-3 text-text-secondary px-2 py-0.5 rounded border border-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

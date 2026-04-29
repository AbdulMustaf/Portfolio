import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { skillsData } from '../data/skillsData'

gsap.registerPlugin(ScrollTrigger)

export default function SkillsGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.skill-category', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const filtered = activeCategory
    ? skillsData.filter((c) => c.category === activeCategory)
    : skillsData

  return (
    <section id="skills" ref={containerRef} className="py-10 px-4 sm:px-6 lg:px-10">
      <h2 className="section-title">Skills & Tech</h2>
      <p className="text-text-secondary text-sm mb-6">— The tools of the trade</p>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
            activeCategory === null
              ? 'bg-netflix-red text-white border-netflix-red'
              : 'bg-transparent text-text-secondary border-white/10 hover:border-white/30 hover:text-white'
          }`}
        >
          All
        </button>
        {skillsData.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category === activeCategory ? null : cat.category)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
              activeCategory === cat.category
                ? 'bg-netflix-red text-white border-netflix-red'
                : 'bg-transparent text-text-secondary border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {cat.icon} {cat.category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.category}
            className="skill-category bg-netflix-dark-2 rounded-xl p-5 border border-white/5 hover:border-netflix-red/25 transition-colors duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{cat.icon}</span>
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">{cat.category}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs text-text-secondary bg-netflix-dark-3 px-2.5 py-1 rounded-full border border-white/5 hover:text-white hover:border-netflix-red/30 transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

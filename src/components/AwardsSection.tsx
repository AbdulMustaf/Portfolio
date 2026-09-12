import { useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaTrophy, FaMedal, FaStar } from 'react-icons/fa'
import { useGlossHover } from '../hooks/useGlossHover'
import GlossOverlay from './GlossOverlay'
import { awardsData } from '../data/awardsData'

gsap.registerPlugin(ScrollTrigger)

/**
 * Icons live here rather than in the data file so the corpus used by the RAG
 * endpoint stays plain serialisable data with no JSX dependency.
 */
const awardIcons: Record<string, ReactNode> = {
  hackhive: <FaTrophy className="text-yellow-400" size={22} />,
  'ops-competition': <FaTrophy className="text-yellow-400" size={22} />,
  hackathon: <FaMedal className="text-gray-300" size={22} />,
  'dean-list': <FaStar className="text-netflix-red" size={22} />,
}

const awards = awardsData

const tierBorder: Record<string, string> = {
  gold: 'border-yellow-500/30 hover:border-yellow-500/60',
  silver: 'border-gray-400/20 hover:border-gray-400/50',
  academic: 'border-netflix-red/20 hover:border-netflix-red/50',
}

function AwardCard({ award }: { award: typeof awards[number] }) {
  const { containerRef, overlayRef, onMouseMove, onMouseEnter, onMouseLeave } = useGlossHover()
  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`award-card gloss-hover bg-netflix-dark-2 rounded-xl p-6 border transition-colors duration-300 ${tierBorder[award.tier]}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-0.5">{awardIcons[award.id]}</div>
        <div>
          <h3 className="text-white font-bold text-sm leading-snug">{award.title}</h3>
          <p className="text-text-secondary text-xs mt-0.5">
            {award.org} · {award.year}
          </p>
        </div>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{award.description}</p>
      <GlossOverlay ref={overlayRef} />
    </div>
  )
}

export default function AwardsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.award-card', {
        y: 40,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
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
    <section ref={containerRef} className="py-10 px-4 sm:px-6 lg:px-10">
      <h2 className="section-title">Awards & Recognition</h2>
      <p className="text-text-secondary text-sm mb-8">— Trending in the leaderboard</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {awards.map((award) => (
          <AwardCard key={award.id} award={award} />
        ))}
      </div>
    </section>
  )
}

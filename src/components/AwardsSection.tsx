import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaTrophy, FaMedal, FaStar } from 'react-icons/fa'

gsap.registerPlugin(ScrollTrigger)

const awards = [
  {
    id: 'ops-competition',
    title: '1st Place — OPS Case Competition',
    org: 'Ontario Public Service',
    year: '2023',
    description:
      'Won first place in the Ontario Public Service case competition for designing a citizen-facing digital service prototype addressing government transformation challenges.',
    icon: <FaTrophy className="text-yellow-400" size={22} />,
    tier: 'gold',
  },
  {
    id: 'hackathon',
    title: 'Hackathon Achievement',
    org: 'Ontario Tech University',
    year: '2023',
    description:
      'Recognized for outstanding technical innovation and teamwork at a university-level hackathon event.',
    icon: <FaMedal className="text-gray-300" size={22} />,
    tier: 'silver',
  },
  {
    id: 'dean-list',
    title: "Dean's List",
    org: 'Ontario Tech University',
    year: '2022–2024',
    description:
      'Recognized on the Dean\'s List for academic excellence across multiple semesters in the Computer Science program.',
    icon: <FaStar className="text-netflix-red" size={22} />,
    tier: 'academic',
  },
]

const tierBorder: Record<string, string> = {
  gold: 'border-yellow-500/30 hover:border-yellow-500/60',
  silver: 'border-gray-400/20 hover:border-gray-400/50',
  academic: 'border-netflix-red/20 hover:border-netflix-red/50',
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
          <div
            key={award.id}
            className={`award-card bg-netflix-dark-2 rounded-xl p-6 border transition-colors duration-300 ${tierBorder[award.tier]}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 mt-0.5">{award.icon}</div>
              <div>
                <h3 className="text-white font-bold text-sm leading-snug">{award.title}</h3>
                <p className="text-text-secondary text-xs mt-0.5">
                  {award.org} · {award.year}
                </p>
              </div>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{award.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

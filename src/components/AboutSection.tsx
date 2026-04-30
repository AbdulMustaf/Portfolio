import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { profileData } from '../data/profileData'
import { FaGraduationCap, FaCode, FaBrain, FaShieldAlt } from 'react-icons/fa'

gsap.registerPlugin(ScrollTrigger)

const highlights = [
  { icon: <FaCode size={18} />, label: 'Software Developer', desc: 'Full-stack dev & QA engineering' },
  { icon: <FaBrain size={18} />, label: 'AI Builder', desc: 'NLP research & AI compliance tools' },
  { icon: <FaGraduationCap size={18} />, label: 'CS Student', desc: 'Ontario Tech University, Co-op' },
  { icon: <FaShieldAlt size={18} />, label: 'Security Interest', desc: 'Compliance & cybersecurity focus' },
]

export default function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about-content', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 80%' },
      })
      gsap.from('.about-highlight', {
        y: 25,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 70%' },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="about" ref={containerRef} className="py-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      <h2 className="section-title">About Me</h2>
      <p className="text-text-secondary text-sm mb-8">— The story behind the profile</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Bio */}
        <div className="about-content space-y-4">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2"
            style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}
          >
            Featured Profile
          </div>
          <h3 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
            Building software that<br />
            <span className="text-netflix-red">actually matters</span>
          </h3>
          <p className="text-text-primary leading-relaxed whitespace-pre-line">{profileData.bio}</p>
          <p className="text-text-secondary text-sm leading-relaxed">
            With experience spanning government digital services, academic AI research, and independent
            project development, I bring a product-minded perspective to every engineering challenge.
            I'm actively looking for opportunities in software engineering, AI, product, and cybersecurity.
          </p>
        </div>

        {/* Highlights grid */}
        <div className="grid grid-cols-2 gap-4">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="about-highlight bg-netflix-dark-2 rounded-xl p-5 border border-white/5 hover:border-netflix-red/30 transition-colors duration-300 group"
            >
              <div className="text-netflix-red mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">
                {h.icon}
              </div>
              <p className="text-white text-sm font-bold mb-1">{h.label}</p>
              <p className="text-text-secondary text-xs">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

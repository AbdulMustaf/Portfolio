import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaLinkedin, FaGithub, FaEnvelope, FaFileAlt } from 'react-icons/fa'
import { profileData } from '../data/profileData'

gsap.registerPlugin(ScrollTrigger)

const buttons = [
  {
    label: 'LinkedIn',
    href: profileData.linkedin,
    icon: <FaLinkedin size={18} />,
    external: true,
    primary: true,
  },
  {
    label: 'GitHub',
    href: profileData.github,
    icon: <FaGithub size={18} />,
    external: true,
    primary: false,
  },
  {
    label: 'Email',
    href: `mailto:${profileData.email}`,
    icon: <FaEnvelope size={18} />,
    external: false,
    primary: false,
  },
  {
    label: 'View Resume',
    href: '/resume',
    icon: <FaFileAlt size={18} />,
    external: false,
    primary: false,
    isRoute: true,
  },
]

export default function ContactButtons() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact-btn', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" ref={containerRef} className="py-14 px-4 sm:px-6 lg:px-10 text-center">
      <h2 className="section-title mb-2 justify-center">Let's Connect</h2>
      <p className="text-text-secondary text-sm mb-8">
        Open to software engineering, AI, product, and cybersecurity opportunities.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {buttons.map((btn) =>
          btn.isRoute ? (
            <Link
              key={btn.label}
              to={btn.href}
              className={`contact-btn flex items-center gap-2.5 px-6 py-3 rounded font-semibold text-sm transition-all duration-200 active:scale-95 border ${
                btn.primary
                  ? 'bg-netflix-red text-white border-netflix-red hover:bg-red-700'
                  : 'bg-transparent text-text-primary border-white/20 hover:border-white/50 hover:text-white'
              }`}
            >
              {btn.icon}
              {btn.label}
            </Link>
          ) : btn.external ? (
            <a
              key={btn.label}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`contact-btn flex items-center gap-2.5 px-6 py-3 rounded font-semibold text-sm transition-all duration-200 active:scale-95 border ${
                btn.primary
                  ? 'bg-netflix-red text-white border-netflix-red hover:bg-red-700'
                  : 'bg-transparent text-text-primary border-white/20 hover:border-white/50 hover:text-white'
              }`}
            >
              {btn.icon}
              {btn.label}
            </a>
          ) : (
            <a
              key={btn.label}
              href={btn.href}
              className={`contact-btn flex items-center gap-2.5 px-6 py-3 rounded font-semibold text-sm transition-all duration-200 active:scale-95 border ${
                btn.primary
                  ? 'bg-netflix-red text-white border-netflix-red hover:bg-red-700'
                  : 'bg-transparent text-text-primary border-white/20 hover:border-white/50 hover:text-white'
              }`}
            >
              {btn.icon}
              {btn.label}
            </a>
          )
        )}
      </div>
    </section>
  )
}

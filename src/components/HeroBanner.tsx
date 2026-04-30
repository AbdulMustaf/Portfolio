import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import HeroMaskReveal from './HeroMaskReveal'
import PlayButton from './PlayButton'
import MoreInfoButton from './MoreInfoButton'
import { profileData } from '../data/profileData'
import { FaMapMarkerAlt } from 'react-icons/fa'

export default function HeroBanner() {
  const navigate = useNavigate()
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const badgesRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.3,
      })
      gsap.from(badgesRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        delay: 0.7,
      })
      gsap.from(buttonsRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        delay: 1.0,
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100svh' }}
    >
      {/* Full-section hero image layer. Mask overlay stays positioned relative to this image layer. */}
      <div className="absolute inset-0">
        {profileData.heroImage ? (
          <HeroMaskReveal
            src={profileData.heroImage}
            alt={`${profileData.name} — hero photo`}
            className="w-full h-full"
            eventContainerRef={sectionRef}
          />
        ) : (
          /* Placeholder gradient when no image provided */
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
            }}
          />
        )}
        {/* Bottom fade into page */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--netflix-dark) 0%, transparent 100%)' }}
        />
      </div>

      {/* Content overlay */}
      <div
        className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-10 lg:px-16 pb-16 lg:pb-20"
        style={{ minHeight: '100svh' }}
      >
        <div className="max-w-2xl" style={{ paddingTop: 'var(--nav-height)' }}>
          {/* Location badge */}
          <div ref={badgesRef} className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-text-secondary text-sm">
              <FaMapMarkerAlt size={12} className="text-netflix-red" />
              {profileData.location}
            </span>
            <span className="text-text-secondary text-sm">·</span>
            <span className="text-netflix-red text-sm font-semibold uppercase tracking-widest">
              Featured Profile
            </span>
          </div>

          {/* Name */}
          <div ref={textRef}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 tracking-tight">
              {profileData.name}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-text-primary font-medium mb-2 leading-snug">
              {profileData.headline}
            </p>
            <p className="text-text-secondary text-sm sm:text-base mb-6">
              {profileData.tagline}
            </p>
            <p className="text-text-primary text-sm sm:text-base leading-relaxed max-w-lg mb-8 line-clamp-3 lg:line-clamp-none">
              {profileData.bio}
            </p>
          </div>

          {/* CTA buttons */}
          <div ref={buttonsRef} className="flex flex-wrap gap-3">
            <PlayButton onClick={() => navigate('/projects')} label="View Projects" />
            <MoreInfoButton
              onClick={() => navigate('/experience')}
              label="More Info"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

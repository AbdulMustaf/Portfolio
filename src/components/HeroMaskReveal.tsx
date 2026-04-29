import { useRef } from 'react'
import HeroMaskOverlay from './HeroMaskOverlay'
import HeroLyricsLayer from './HeroLyricsLayer'

// Hero image tuning:
// imageScale gives a little extra crop room while keeping the image covering the full hero.
// Avoid using translateX here unless imageScale is large enough, because it can expose the
// black page background on one side of the hero.
const imageScale = 1.08

interface Props {
  src: string
  alt: string
  className?: string
  /**
   * The hero content layer sits above this image, so the section ref is used for
   * pointer events while this component still owns the face-positioned overlay.
   */
  eventContainerRef?: React.RefObject<HTMLElement | null>
}

export default function HeroMaskReveal({ src, alt, className = '', eventContainerRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ isolation: 'isolate', cursor: 'pointer' }}
    >
      <HeroLyricsLayer />
      <img
        src={src}
        alt={alt}
        className="relative z-[1] block w-full h-full object-cover"
        style={{
          filter: 'grayscale(100%) contrast(1.05)',
          objectPosition: 'center top',
          transform: `scale(${imageScale})`,
          transformOrigin: 'center top',
        }}
        draggable={false}
      />
      <HeroMaskOverlay eventContainerRef={eventContainerRef ?? containerRef} />
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(20,20,20,0.88) 0%, rgba(20,20,20,0.5) 42%, rgba(20,20,20,0.48) 70%, rgba(20,20,20,0.62) 100%)',
        }}
      />
    </div>
  )
}

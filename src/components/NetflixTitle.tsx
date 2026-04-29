import { useEffect, useState } from 'react'
import { profileData } from '../data/profileData'

interface Props {
  onComplete: () => void
}

export default function NetflixTitle({ onComplete }: Props) {
  const [phase, setPhase] = useState<'fadeIn' | 'hold' | 'zoomOut' | 'done'>('fadeIn')
  useEffect(() => {
    // Phase 1: fade in (600ms)
    const t1 = setTimeout(() => setPhase('hold'), 600)
    // Phase 2: hold (1400ms)
    const t2 = setTimeout(() => setPhase('zoomOut'), 2000)
    // Phase 3: zoom out (700ms) then done
    const t3 = setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 2700)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  if (phase === 'done') return null

  return (
    <div className="netflix-title-screen">
      <span className={`netflix-title-name ${phase === 'zoomOut' ? 'zoom-out' : ''}`}>
        {profileData.name}
      </span>
    </div>
  )
}

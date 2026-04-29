import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface Props {
  eventContainerRef?: React.RefObject<HTMLElement | null>
}

// Mask coordinates are relative to the hero image wrapper.
// Increase maskTop to move the mask down; decrease it to move the mask up.
// Increase maskLeft to move the mask right; decrease it to move the mask left.
// Increase maskWidth to make the mask larger; decrease it to make it smaller.
const maskTop = '0%'
const maskLeft = '86%'
const maskWidth = 'clamp(514.8px, 46.719vw, 811.8px)'
const maskRotation = '0deg'
const SymbioteMaskCanvas = lazy(() => import('./SymbioteMaskCanvas'))

const hoverZone = {
  left: 32,
  right: 72,
  top: 5,
  bottom: 92,
}

const scannerMask = 'linear-gradient(to right, transparent, black 16%, black 84%, transparent)'

/**
 * Tune the Spider-Man mask alignment here:
 * - maskTop moves the mask up/down over the face.
 * - maskLeft moves it left/right.
 * - maskWidth controls the mask size.
 * - maskRotation tilts the mask.
 * - hoverZone controls where desktop hover/tap activates the reveal.
 */
export default function HeroMaskOverlay({ eventContainerRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<HTMLDivElement>(null)
  const isTappedOpenRef = useRef(false)
  const isMaskVisibleRef = useRef(false)
  const scannerRef = useRef({ size: 0, opacity: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const mask = maskRef.current
    const eventTarget = eventContainerRef?.current ?? rootRef.current
    if (!mask || !eventTarget) return
    const scannerState = scannerRef.current

    const applyScanner = () => {
      const size = `${scannerState.size}px 100%`
      mask.style.opacity = String(scannerState.opacity)
      mask.style.webkitMaskSize = size
      mask.style.maskSize = size
    }

    const showMask = () => {
      if (isMaskVisibleRef.current) return
      isMaskVisibleRef.current = true
      gsap.killTweensOf(scannerState)
      mask.style.webkitMaskPosition = 'center'
      mask.style.maskPosition = 'center'
      gsap.to(scannerState, {
        opacity: 1,
        size: 260,
        duration: 0.38,
        ease: 'power3.out',
        onUpdate: applyScanner,
      })
      gsap.to(mask, {
        scale: 1,
        filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.48)) brightness(1)',
        duration: 0.38,
        ease: 'power3.out',
      })
    }

    const hideMask = () => {
      if (!isMaskVisibleRef.current) return
      isMaskVisibleRef.current = false
      gsap.killTweensOf(scannerState)
      gsap.to(scannerState, {
        opacity: 0,
        size: 0,
        duration: 0.34,
        ease: 'power3.in',
        onUpdate: applyScanner,
      })
      gsap.to(mask, {
        scale: 0.985,
        filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.22)) brightness(0.9)',
        duration: 0.34,
        ease: 'power2.inOut',
      })
    }

    gsap.set(mask, {
      xPercent: -50,
      rotation: maskRotation,
      scale: 0.985,
      transformOrigin: '50% 18%',
      filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.22)) brightness(0.9)',
    })
    applyScanner()

    const updateScannerPosition = (event: PointerEvent) => {
      const maskRect = mask.getBoundingClientRect()
      const x = event.clientX - maskRect.left
      const scannerWidth = window.matchMedia('(max-width: 760px)').matches ? 210 : 260
      const position = `${x - scannerWidth / 2}px center`

      if (isMaskVisibleRef.current) {
        mask.style.webkitMaskPosition = position
        mask.style.maskPosition = position
      }

      const rect = eventTarget.getBoundingClientRect()
      const moveFactor = window.matchMedia('(max-width: 760px)').matches ? 3 : 10
      setMousePos({
        x: ((event.clientX - rect.left) / rect.width - 0.5) * moveFactor,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * moveFactor,
      })
    }

    const isInsideHoverZone = (event: PointerEvent) => {
      const rect = eventTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100

      return x >= hoverZone.left && x <= hoverZone.right && y >= hoverZone.top && y <= hoverZone.bottom
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (isInsideHoverZone(event)) {
        updateScannerPosition(event)
        showMask()
      } else {
        hideMask()
      }
    }

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        hideMask()
        setMousePos({ x: 0, y: 0 })
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || !isInsideHoverZone(event)) return
      updateScannerPosition(event)
      isTappedOpenRef.current = !isTappedOpenRef.current
      if (isTappedOpenRef.current) showMask()
      else {
        hideMask()
        setMousePos({ x: 0, y: 0 })
      }
    }

    eventTarget.addEventListener('pointermove', onPointerMove)
    eventTarget.addEventListener('pointerleave', onPointerLeave)
    eventTarget.addEventListener('pointerup', onPointerUp)

    return () => {
      eventTarget.removeEventListener('pointermove', onPointerMove)
      eventTarget.removeEventListener('pointerleave', onPointerLeave)
      eventTarget.removeEventListener('pointerup', onPointerUp)
      gsap.killTweensOf(scannerState)
      gsap.killTweensOf(mask)
    }
  }, [eventContainerRef])

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        ref={maskRef}
        className="absolute z-[3]"
        style={{
          top: maskTop,
          left: maskLeft,
          width: maskWidth,
          opacity: 0,
          transform: `translateX(-50%) rotate(${maskRotation}) scale(0.985)`,
          WebkitMaskImage: scannerMask,
          maskImage: scannerMask,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: '0px 100%',
          maskSize: '0px 100%',
          willChange: 'opacity, transform, mask-size, mask-position',
        }}
      >
        <div className="aspect-[0.68] w-full">
          <Suspense fallback={null}>
            <SymbioteMaskCanvas mousePos={mousePos} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

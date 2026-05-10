import { useRef } from 'react'

export function useGlossHover<C extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<C>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent) => {
    const overlay = overlayRef.current
    const container = containerRef.current
    if (!overlay || !container) return
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    overlay.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 38%, transparent 65%)`
  }

  const onMouseEnter = () => {
    if (overlayRef.current) overlayRef.current.style.opacity = '1'
  }

  const onMouseLeave = () => {
    if (overlayRef.current) overlayRef.current.style.opacity = '0'
  }

  return { containerRef, overlayRef, onMouseMove, onMouseEnter, onMouseLeave }
}

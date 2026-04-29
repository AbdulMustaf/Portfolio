import { useEffect, useState } from 'react'

const cursorFrames = [
  '/cursor/cursor-frame-00.png',
  '/cursor/cursor-frame-01.png',
]

const pointerCursor = '/cursor/pointer.png'
const interactiveSelector = 'a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])'

export default function CustomCursor() {
  const [frameIndex, setFrameIndex] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)
  const [isPointer, setIsPointer] = useState(false)

  useEffect(() => {
    const frameTimer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % cursorFrames.length)
    }, 180)

    return () => window.clearInterval(frameTimer)
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return

      setPosition({ x: event.clientX, y: event.clientY })
      setVisible(true)
      setIsPointer(Boolean((event.target as Element | null)?.closest?.(interactiveSelector)))
    }

    const handlePointerLeave = () => setVisible(false)

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <img
      className={`custom-cursor ${visible ? 'is-visible' : ''}`}
      src={isPointer ? pointerCursor : cursorFrames[frameIndex]}
      alt=""
      aria-hidden="true"
      style={{ left: position.x, top: position.y }}
    />
  )
}

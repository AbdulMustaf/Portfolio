import { forwardRef } from 'react'

const GlossOverlay = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      opacity: 0,
      transition: 'opacity 0.25s ease',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  />
))

GlossOverlay.displayName = 'GlossOverlay'
export default GlossOverlay

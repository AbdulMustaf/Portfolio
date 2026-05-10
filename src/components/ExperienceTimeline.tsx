import 'react-vertical-timeline-component/style.min.css'
import { useEffect, useRef } from 'react'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component'
import { MdOutlineWork } from 'react-icons/md'
import { IoSchool } from 'react-icons/io5'
import { FaFlask, FaStar } from 'react-icons/fa'
import { experienceData } from '../data/experienceData'

const TYPE_CONFIG: Record<string, {
  cardBg: string
  cardText: string
  arrowColor: string
  iconBg: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  'Co-op': {
    cardBg: 'rgb(33, 150, 243)',
    cardText: '#fff',
    arrowColor: 'rgb(33, 150, 243)',
    iconBg: 'rgb(33, 150, 243)',
    Icon: MdOutlineWork,
  },
  'Research': {
    cardBg: 'rgb(103, 58, 183)',
    cardText: '#fff',
    arrowColor: 'rgb(103, 58, 183)',
    iconBg: 'rgb(103, 58, 183)',
    Icon: FaFlask,
  },
  'Education': {
    cardBg: 'rgb(255, 224, 230)',
    cardText: '#000',
    arrowColor: 'rgb(255, 224, 230)',
    iconBg: 'rgb(255, 160, 200)',
    Icon: IoSchool,
  },
}

const OVERLAY_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  inset: '0',
  borderRadius: 'inherit',
  opacity: '0',
  transition: 'opacity 0.25s ease',
  pointerEvents: 'none',
  zIndex: '10',
}

export default function ExperienceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Inject a real overlay div into each timeline card after mount
    const cards = container.querySelectorAll<HTMLElement>('.vertical-timeline-element-content')
    const overlays = new Map<HTMLElement, HTMLDivElement>()

    cards.forEach((card) => {
      const overlay = document.createElement('div')
      Object.assign(overlay.style, OVERLAY_STYLE)
      overlay.setAttribute('aria-hidden', 'true')
      card.appendChild(overlay)
      overlays.set(card, overlay)
    })

    const handleMouseMove = (e: MouseEvent) => {
      const card = (e.target as Element).closest<HTMLElement>('.vertical-timeline-element-content')
      if (!card) return
      const overlay = overlays.get(card)
      if (!overlay) return
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      overlay.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 38%, transparent 65%)`
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement
      const overlay = overlays.get(card)
      if (overlay) overlay.style.opacity = '1'
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement
      const overlay = overlays.get(card)
      if (overlay) overlay.style.opacity = '0'
    }

    container.addEventListener('mousemove', handleMouseMove)
    cards.forEach((card) => {
      card.addEventListener('mouseenter', handleMouseEnter)
      card.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      cards.forEach((card) => {
        card.removeEventListener('mouseenter', handleMouseEnter)
        card.removeEventListener('mouseleave', handleMouseLeave)
        overlays.get(card)?.remove()
      })
    }
  }, [])

  return (
    <div ref={containerRef} className="timeline-container">
      <h2 className="timeline-title">📅 Work Experience &amp; Education Timeline</h2>

      <VerticalTimeline lineColor="#2f2f2f">
        {experienceData.map((exp) => {
          const cfg = TYPE_CONFIG[exp.type] ?? TYPE_CONFIG['Co-op']
          const Icon = cfg.Icon

          return (
            <VerticalTimelineElement
              key={exp.id}
              contentStyle={{
                background: cfg.cardBg,
                color: cfg.cardText,
                boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
              contentArrowStyle={{ borderRight: `7px solid ${cfg.arrowColor}` }}
              date={exp.dates}
              iconStyle={{ background: cfg.iconBg, color: '#fff' }}
              icon={<Icon />}
            >
              <div style={{ color: cfg.cardText }}>
                <h3 className="vertical-timeline-element-title font-bold text-lg leading-snug">
                  {exp.role}
                </h3>
                <h4 className="vertical-timeline-element-subtitle font-medium text-sm mt-1 opacity-90">
                  {exp.orgFull}
                </h4>
                {exp.type !== 'Education' && (
                  <p className="text-xs mt-0.5 opacity-70">{exp.location}</p>
                )}
                <p className="text-sm leading-relaxed mt-3 opacity-90">{exp.description}</p>

                {exp.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {exp.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2 text-sm opacity-85">
                        <span className="flex-shrink-0">›</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {exp.tech.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {exp.tech.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </VerticalTimelineElement>
          )
        })}

        <VerticalTimelineElement
          iconStyle={{ background: 'rgb(16, 204, 82)', color: '#fff' }}
          icon={<FaStar />}
        />
      </VerticalTimeline>
    </div>
  )
}

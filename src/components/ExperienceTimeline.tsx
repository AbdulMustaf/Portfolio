import 'react-vertical-timeline-component/style.min.css'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component'
import { MdOutlineWork } from 'react-icons/md'
import { IoSchool } from 'react-icons/io5'
import { FaFlask, FaStar } from 'react-icons/fa'
import { experienceData } from '../data/experienceData'

// Mirrors the reference: work=blue, research=purple, education=pink
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

export default function ExperienceTimeline() {
  return (
    <div className="timeline-container">
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
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

        {/* Closing star — same as reference */}
        <VerticalTimelineElement
          iconStyle={{ background: 'rgb(16, 204, 82)', color: '#fff' }}
          icon={<FaStar />}
        />
      </VerticalTimeline>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { FaBriefcase, FaFlask, FaGraduationCap, FaChevronDown } from 'react-icons/fa'
import { experienceData } from '../data/experienceData'
import type { Experience } from '../data/experienceData'
import { categoryOfTech, colorForTech } from '../lib/skillCategories'
import { useGlossHover } from '../hooks/useGlossHover'
import GlossOverlay from './GlossOverlay'

// ─── Types & config ───────────────────────────────────────────────────────────

type FilterKey = 'All' | 'Work' | 'Research' | 'Education'

interface TypeMeta {
  accent: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  filter: Exclude<FilterKey, 'All'>
}

/** Accent colours are used for the rail dot, badge and card edge — never as a
 *  card background, so the timeline stays inside the site's dark palette. */
const TYPE_META: Record<string, TypeMeta> = {
  'Co-op': { accent: '#3b82f6', Icon: FaBriefcase, filter: 'Work' },
  Research: { accent: '#a855f7', Icon: FaFlask, filter: 'Research' },
  Education: { accent: '#ec4899', Icon: FaGraduationCap, filter: 'Education' },
}

const FALLBACK_META: TypeMeta = { accent: '#6b7280', Icon: FaBriefcase, filter: 'Work' }

const metaFor = (type: string): TypeMeta => TYPE_META[type] ?? FALLBACK_META

// ─── Dates ────────────────────────────────────────────────────────────────────

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function parseMonth(token: string): Date | null {
  const match = token.trim().match(/^([a-z]{3})[a-z]*\s+(\d{4})$/i)
  if (!match) return null
  const index = MONTHS.indexOf(match[1].toLowerCase())
  if (index < 0) return null
  return new Date(Number(match[2]), index, 1)
}

/**
 * Turns "Jan 2026 – Present" into a human duration.
 *
 * The data stores dates as display strings, so this parses rather than reading
 * a structured field. Anything it cannot parse yields an empty string and the
 * caller simply omits the duration — a wrong duration is worse than none on a
 * page recruiters read.
 */
function durationOf(dates: string, now: Date): string {
  const [rawStart, rawEnd] = dates.split(/\s*[–—-]\s*/)
  if (!rawStart || !rawEnd) return ''

  const start = parseMonth(rawStart)
  if (!start) return ''
  const end = /present|current/i.test(rawEnd) ? now : parseMonth(rawEnd)
  if (!end) return ''

  // Inclusive of both endpoint months: a May–Aug placement reads as 4 months.
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
  if (months < 1) return ''

  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearPart = years ? `${years} yr${years > 1 ? 's' : ''}` : ''
  const monthPart = rest ? `${rest} mo${rest > 1 ? 's' : ''}` : ''
  return [yearPart, monthPart].filter(Boolean).join(' ')
}

const isCurrent = (dates: string) => /present|current/i.test(dates)

// ─── Entry card ───────────────────────────────────────────────────────────────

function TimelineEntry({
  experience,
  now,
  defaultOpen,
  activeTech,
  onToggleTech,
}: {
  experience: Experience
  now: Date
  defaultOpen: boolean
  activeTech: string | null
  onToggleTech: (tech: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { containerRef, overlayRef, onMouseMove, onMouseEnter, onMouseLeave } =
    useGlossHover<HTMLDivElement>()

  const { accent, Icon } = metaFor(experience.type)
  const live = isCurrent(experience.dates)
  const duration = durationOf(experience.dates, now)
  // Several entries have no description, so the lead highlight stands in as the
  // summary — and is then dropped from the expanded list rather than printed twice.
  const hasDescription = Boolean(experience.description)
  const summary = hasDescription ? experience.description : experience.highlights[0] ?? ''
  const details = hasDescription ? experience.highlights : experience.highlights.slice(1)
  const panelId = `experience-panel-${experience.id}`

  return (
    <li className="relative pl-14 sm:pl-20 pb-10 last:pb-0">
      {/* Rail marker */}
      <span
        className="absolute left-[14px] sm:left-5 top-1 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-netflix-dark"
        style={{ borderColor: accent }}
        aria-hidden="true"
      >
        <Icon size={13} className="text-white" />
        {live && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-60"
            style={{ border: `2px solid ${accent}` }}
          />
        )}
      </span>

      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="gloss-hover relative overflow-hidden rounded-xl border border-white/10 bg-netflix-dark-2 transition-colors duration-300 hover:border-white/25"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        <GlossOverlay ref={overlayRef} />

        <div className="relative z-[11] p-5 sm:p-6">
          {/* Meta line */}
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <span
              className="rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide"
              style={{ background: `${accent}22`, color: accent }}
            >
              {experience.type}
            </span>
            <span className="text-text-secondary">{experience.dates}</span>
            {duration && (
              <>
                <span className="text-text-secondary/40" aria-hidden="true">•</span>
                <span className="text-text-secondary">{duration}</span>
              </>
            )}
            {live && (
              <span className="flex items-center gap-1.5 font-semibold text-[#4ade80]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" aria-hidden="true" />
                Active
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">
            {experience.role}
          </h3>
          <p className="mt-0.5 text-sm text-text-secondary">
            {experience.orgFull}
            {experience.location && ` · ${experience.location}`}
          </p>

          {summary && (
            <p className="mt-3 text-sm leading-relaxed text-text-primary/80">{summary}</p>
          )}

          {/* Expandable detail. The 0fr→1fr grid row animates height without
              needing to measure the content. */}
          {details.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls={panelId}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/70 rounded"
              >
                <FaChevronDown
                  size={11}
                  className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
                {open ? 'Hide' : 'Show'} {details.length} highlight
                {details.length > 1 ? 's' : ''}
              </button>

              <div
                id={panelId}
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
              >
                <div className="overflow-hidden">
                  <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
                    {details.map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-text-primary/85">
                        <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: accent }} aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {experience.tech.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {experience.tech.map((tech) => {
                const color = colorForTech(tech)
                const category = categoryOfTech(tech)
                const selected = activeTech === tech

                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => onToggleTech(tech)}
                    aria-pressed={selected}
                    title={category ? `${category} — filter by ${tech}` : `Filter by ${tech}`}
                    className="rounded border px-2 py-1 text-[11px] transition-all duration-200 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    style={{
                      color,
                      borderColor: selected ? color : `${color}55`,
                      background: selected ? `${color}33` : `${color}14`,
                    }}
                  >
                    {tech}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export default function ExperienceTimeline() {
  const [filter, setFilter] = useState<FilterKey>('All')
  const [techFilter, setTechFilter] = useState<string | null>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  // Rendered once per mount so every duration on the page shares one "now".
  const now = useMemo(() => new Date(), [])

  // Counts follow the active skill filter, so a pill never advertises more
  // roles than clicking it would actually show.
  const counts = useMemo(() => {
    const pool = techFilter
      ? experienceData.filter((item) => item.tech.includes(techFilter))
      : experienceData
    const tally: Record<FilterKey, number> = { All: pool.length, Work: 0, Research: 0, Education: 0 }
    for (const item of pool) tally[metaFor(item.type).filter] += 1
    return tally
  }, [techFilter])

  const visible = useMemo(() => {
    const byTrack =
      filter === 'All' ? experienceData : experienceData.filter((item) => metaFor(item.type).filter === filter)
    return techFilter ? byTrack.filter((item) => item.tech.includes(techFilter)) : byTrack
  }, [filter, techFilter])

  /**
   * Clicking a tag filters by it; clicking the same tag again clears it.
   * The track filter resets at the same time — otherwise picking a skill used
   * only in another track would silently empty the timeline.
   */
  const toggleTech = (tech: string) => {
    setTechFilter((current) => (current === tech ? null : tech))
    setFilter('All')
  }

  // Fills the rail as the timeline scrolls past the middle of the viewport.
  useEffect(() => {
    const update = () => {
      const rail = railRef.current
      if (!rail) return
      const rect = rail.getBoundingClientRect()
      const marker = window.innerHeight * 0.5
      const ratio = (marker - rect.top) / Math.max(1, rect.height)
      setProgress(Math.min(1, Math.max(0, ratio)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [visible.length])

  const filters: FilterKey[] = ['All', 'Work', 'Research', 'Education']

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <header className="mb-9">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-netflix-red">
          Career
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          Experience &amp; Education
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          Machine-learning research, government software engineering, product management and
          data work — filter by track, and open any role for what actually shipped.
        </p>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter timeline by type">
        {filters.map((key) => {
          const selected = filter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/70 ${
                selected
                  ? 'border-netflix-red bg-netflix-red text-white'
                  : 'border-white/15 bg-white/[0.03] text-text-secondary hover:border-white/35 hover:text-white'
              }`}
            >
              {key}
              <span className={selected ? 'ml-1.5 opacity-80' : 'ml-1.5 opacity-60'}>
                {counts[key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active skill filter */}
      <div className="mb-10 min-h-[34px]">
        {techFilter && (
          <button
            type="button"
            onClick={() => setTechFilter(null)}
            className="group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
            style={{
              color: colorForTech(techFilter),
              borderColor: `${colorForTech(techFilter)}66`,
              background: `${colorForTech(techFilter)}1a`,
            }}
          >
            <span className="text-text-secondary">Using</span>
            <span className="font-semibold">{techFilter}</span>
            <span className="text-text-secondary transition-colors group-hover:text-white" aria-hidden="true">
              ✕
            </span>
            <span className="sr-only">Clear skill filter</span>
          </button>
        )}
      </div>

      {/* Timeline */}
      <div ref={railRef} className="relative">
        {/* Track + scroll-driven fill */}
        <div
          className="absolute left-[14px] sm:left-5 top-1 bottom-1 w-px -translate-x-1/2 bg-white/10"
          aria-hidden="true"
        >
          <div
            className="w-full origin-top bg-gradient-to-b from-netflix-red to-netflix-red/20 transition-[height] duration-150 ease-out"
            style={{ height: `${progress * 100}%` }}
          />
        </div>

        <ul className="relative">
          {visible.map((experience, index) => (
            <TimelineEntry
              key={experience.id}
              experience={experience}
              now={now}
              // The newest entry opens by default so the page never lands fully collapsed.
              defaultOpen={index === 0}
              activeTech={techFilter}
              onToggleTech={toggleTech}
            />
          ))}
        </ul>

        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-text-secondary">
            Nothing matches that filter.
          </p>
        )}
      </div>
    </section>
  )
}

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { experienceData } from '../data/experienceData'
import { skillsData } from '../data/skillsData'

type NodeType = 'profile' | 'experience' | 'category' | 'skill'

interface GraphNode {
  id: string
  label: string
  type: NodeType
  color: string
  description?: string
  meta?: string
  /** normalised distance from the centre (0 = centre, 1 = outer edge) used to seed the layout */
  seedT: number
  /** seed angle in radians */
  seedAngle: number
  /** which outer shell a skill was seeded on; staggers its caption lane */
  lane: number
}

interface PlacedNode extends GraphNode {
  x: number
  y: number
  r: number
  short: string
  fontSize: number
  haloWidth: number
  labelDy: number
  /** cursor distance at which this node starts reacting / revealing its label */
  hoverReach: number
  labelReach: number
  /** per-node drift constants so every circle floats on its own rhythm */
  ampX: number
  ampY: number
  freqX: number
  freqY: number
  phaseX: number
  phaseY: number
  harmonicX: number
  harmonicY: number
  /** furthest the drift can carry this node from its resting point, per axis */
  spanX: number
  spanY: number
}

interface GraphEdge {
  source: string
  target: string
}

const PROFILE_ID = 'profile-mufasa'
const TAU = Math.PI * 2

/** Reference canvas the node sizes below are authored against. */
const REFERENCE_AREA = 900 * 640

/** Circle diameters at scale 1. */
const NODE_SIZE: Record<NodeType, number> = {
  profile: 104,
  experience: 72,
  category: 58,
  skill: 42,
}
const FONT_SIZE: Record<NodeType, number> = {
  profile: 16,
  experience: 13.5,
  category: 13,
  skill: 11,
}
/** How firmly a node is held to its seeded ring position during relaxation. */
const SEED_PULL: Record<NodeType, number> = {
  profile: 1,
  experience: 0.1,
  category: 0.06,
  skill: 0.03,
}
/** Peak idle float amplitude in px at scale 1, per axis. */
const DRIFT: Record<NodeType, number> = {
  profile: 3,
  experience: 4.5,
  category: 5.3,
  skill: 6.4,
}
/** A second, faster sine per axis turns the path from a tidy ellipse into a
 *  wander. Ratios are relative to each node's primary amplitude / frequency. */
const DRIFT_HARMONIC = 0.38
const DRIFT_HARMONIC_RATE = 1.63
/** rad/ms — a 5.2s to 9.7s primary period, randomised per node and per axis.
 *  Perceived liveliness is amplitude x frequency, so the throw is kept short
 *  and the rate carries the motion; that keeps neighbours from colliding. */
const DRIFT_SPEED_MIN = 0.00065
const DRIFT_SPEED_RANGE = 0.00055
/** Share of a node's drift range that is reserved as breathing room between
 *  neighbours, so independent wander rarely turns into real overlap. */
const DRIFT_CLEARANCE = 0.6
/** prefers-reduced-motion keeps the graph alive but markedly calmer. */
const REDUCED_AMPLITUDE = 0.55
const REDUCED_SPEED = 0.7
const LABEL_MAX: Record<NodeType, number> = {
  profile: 12,
  experience: 17,
  category: 18,
  skill: 14,
}
/** Captions are clipped harder on a small canvas, where a full-length label is
 *  wider than the space a node can claim. */
const LABEL_MAX_COMPACT: Record<NodeType, number> = {
  profile: 12,
  experience: 12,
  category: 12,
  skill: 11,
}
const COMPACT_SCALE = 0.74

const RELAX_STEPS = 200
const SETTLE_STEPS = 120
const COLLISION_PAD = 8
const HOVER_RADIUS = 150
const HOVER_GAIN = 0.3
const ACTIVE_GAIN = 0.15
/** Skill labels fade in inside this radius of the cursor — 78 permanent labels
 *  would overlap into noise, so they are revealed on approach instead. */
const LABEL_RADIUS = 118
/** ms — time constant of the scale easing, keeps the response frame-rate independent. */
const SCALE_EASE = 90

const SKILL_SHELLS = [0.67, 0.84, 1]
/** < 1 pushes the skill shells toward a squircle; 1 would be a plain ellipse. */
const SKILL_BULGE = 0.7

const CATEGORY_COLORS = [
  '#e50914',
  '#f5a524',
  '#2dd4bf',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#84cc16',
  '#fb7185',
]

const SKILL_ALIASES: Record<string, string> = {
  Testing: 'Automated Testing',
  Research: 'Research',
  'Data Structures': 'Data Structures',
  Algorithms: 'Algorithms',
  'Operating Systems': 'Operating Systems',
  Networking: 'Networking',
  'Data Pipelines': 'Data Pipelines',
}

function toId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function shortLabel(label: string, max: number) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value
}

/** Stable per-id number in [0, 1) so the idle drift is deterministic across renders. */
function hash01(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 100000) / 100000
}

function approxTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.56
}

function buildGraph() {
  const categoryBySkill = new Map<string, string>()
  const skillSet = new Set<string>()

  skillsData.forEach((category) => {
    category.skills.forEach((skill) => {
      categoryBySkill.set(skill, category.category)
      skillSet.add(skill)
    })
  })

  experienceData.forEach((experience) => {
    experience.tech.forEach((skill) => skillSet.add(SKILL_ALIASES[skill] ?? skill))
  })

  const categorySkillMap = new Map<string, string[]>()
  skillSet.forEach((skill) => {
    const category = categoryBySkill.get(skill) ?? 'Experience-Specific'
    categorySkillMap.set(category, [...(categorySkillMap.get(category) ?? []), skill])
  })

  const categories = Array.from(categorySkillMap.keys())
  const totalSkills = skillSet.size

  const nodes: GraphNode[] = [
    {
      id: PROFILE_ID,
      label: 'Abdullah',
      type: 'profile',
      color: '#ffffff',
      description: 'Portfolio knowledge graph root',
      meta: 'Skills, education, research, and work experience',
      seedT: 0,
      seedAngle: 0,
      lane: 0,
    },
  ]
  const edges: GraphEdge[] = []

  experienceData.forEach((experience, index) => {
    const node: GraphNode = {
      id: `experience-${experience.id}`,
      label: experience.org,
      type: 'experience',
      color:
        experience.type === 'Education' ? '#f472b6' : experience.type === 'Research' ? '#a78bfa' : '#38bdf8',
      description: experience.role,
      meta: `${experience.type} | ${experience.dates}`,
      seedT: 0.31,
      seedAngle: -Math.PI / 2 + ((index + 0.5) / experienceData.length) * TAU,
      lane: 0,
    }
    nodes.push(node)
    edges.push({ source: PROFILE_ID, target: node.id })
  })

  // Every category owns an angular wedge sized by its skill count, so the outer
  // band ends up with a uniform angular gap between skills all the way around.
  let wedgeStart = -Math.PI / 2
  categories.forEach((category, categoryIndex) => {
    const skills = [...(categorySkillMap.get(category) ?? [])].sort()
    const wedge = (skills.length / totalSkills) * TAU
    const color = CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length]

    const categoryId = `category-${toId(category)}`
    nodes.push({
      id: categoryId,
      label: category,
      type: 'category',
      color,
      description: `${skills.length} mapped skills`,
      seedT: 0.52,
      seedAngle: wedgeStart + wedge / 2,
      lane: 0,
    })
    edges.push({ source: PROFILE_ID, target: categoryId })

    skills.forEach((skill, skillIndex) => {
      const node: GraphNode = {
        id: `skill-${toId(skill)}`,
        label: skill,
        type: 'skill',
        color,
        description: `Part of ${category}`,
        meta:
          experienceData
            .filter((experience) => experience.tech.map((tech) => SKILL_ALIASES[tech] ?? tech).includes(skill))
            .map((experience) => experience.org)
            .join(', ') || 'Listed skill',
        // Three staggered shells fill the outer band instead of piling every
        // skill against the boundary.
        seedT: SKILL_SHELLS[skillIndex % SKILL_SHELLS.length],
        seedAngle: wedgeStart + ((skillIndex + 0.5) / skills.length) * wedge,
        lane: skillIndex % 2,
      }
      nodes.push(node)
      edges.push({ source: categoryId, target: node.id })
    })

    wedgeStart += wedge
  })

  experienceData.forEach((experience) => {
    experience.tech.forEach((tech) => {
      const skill = SKILL_ALIASES[tech] ?? tech
      edges.push({ source: `experience-${experience.id}`, target: `skill-${toId(skill)}` })
    })
  })

  return { nodes, edges }
}

/**
 * Seeds the nodes onto concentric ellipses, then relaxes them with pairwise
 * collision resolution and hard bounds so the constellation spreads into the
 * whole canvas without any circle or label leaving it.
 */
function layoutGraph(nodes: GraphNode[], width: number, height: number): PlacedNode[] {
  const scale = clamp(Math.sqrt((width * height) / REFERENCE_AREA), 0.44, 1.15)
  const labelMax = scale < COMPACT_SCALE ? LABEL_MAX_COMPACT : LABEL_MAX
  const centerX = width / 2
  const centerY = height / 2

  const round = (value: number, places = 1) => {
    const factor = 10 ** places
    return Math.round(value * factor) / factor
  }

  const placed: PlacedNode[] = nodes.map((node) => {
    const r = round((NODE_SIZE[node.type] * scale) / 2, 2)
    const fontSize = round(Math.max(8.5, FONT_SIZE[node.type] * scale))
    const short = shortLabel(node.label, labelMax[node.type])
    // Amplitudes vary per node and per axis so nothing moves in lockstep.
    const ampX = DRIFT[node.type] * scale * (0.7 + hash01(`${node.id}ax`) * 0.6)
    const ampY = DRIFT[node.type] * scale * (0.7 + hash01(`${node.id}ay`) * 0.6)
    return {
      ...node,
      r,
      fontSize,
      short,
      haloWidth: round(Math.max(2.6, (node.type === 'skill' ? 4.4 : 3.8) * scale)),
      hoverReach: HOVER_RADIUS * scale + r,
      labelReach: LABEL_RADIUS * scale + r,
      x: centerX,
      y: centerY,
      labelDy: 0,
      ampX,
      ampY,
      freqX: DRIFT_SPEED_MIN + hash01(`${node.id}fx`) * DRIFT_SPEED_RANGE,
      freqY: DRIFT_SPEED_MIN + hash01(`${node.id}fy`) * DRIFT_SPEED_RANGE,
      phaseX: hash01(`${node.id}px`) * TAU,
      phaseY: hash01(`${node.id}py`) * TAU,
      harmonicX: hash01(`${node.id}hx`) * TAU,
      harmonicY: hash01(`${node.id}hy`) * TAU,
      spanX: ampX * (1 + DRIFT_HARMONIC),
      spanY: ampY * (1 + DRIFT_HARMONIC),
    }
  })

  // Per-node bounds reserve room for the circle and for the label under/over it.
  const minX: number[] = []
  const maxX: number[] = []
  const minY: number[] = []
  const maxY: number[] = []
  placed.forEach((node, index) => {
    const labelRoom =
      node.type === 'profile' ? 0 : node.fontSize + 12 + (node.type === 'skill' ? node.fontSize + 5 : 0)
    // The drift span is part of the padding, so a floating node can never carry
    // itself (or its caption) outside the canvas.
    const horizontal = Math.max(node.r, approxTextWidth(node.short, node.fontSize) / 2) + node.spanX + 5
    const vertical = node.r + labelRoom + node.spanY + 5
    minX[index] = Math.min(horizontal, centerX)
    maxX[index] = Math.max(width - horizontal, centerX)
    minY[index] = Math.min(vertical, centerY)
    maxY[index] = Math.max(height - vertical, centerY)
  })

  // Each node is seeded on the largest ellipse that still respects its own
  // bounds, so a short label is free to sit further out than a long one.
  const seedX = new Float64Array(placed.length)
  const seedY = new Float64Array(placed.length)
  placed.forEach((node, index) => {
    const rx = Math.min(centerX - minX[index], maxX[index] - centerX)
    const ry = Math.min(centerY - minY[index], maxY[index] - centerY)
    // The pinned profile sits dead centre; everything else gets a hair of
    // offset so two coincident seeds still have a direction to separate along.
    const jitter = node.type === 'profile' ? 0 : (hash01(node.id) - 0.5) * 2
    const cos = Math.cos(node.seedAngle)
    const sin = Math.sin(node.seedAngle)
    // Skills ride a squircle rather than an ellipse so the outer band reaches
    // into the corners of a rectangular canvas instead of leaving them bare.
    const bulge = node.type === 'skill' ? SKILL_BULGE : 1
    const unitX = Math.sign(cos) * Math.abs(cos) ** bulge
    const unitY = Math.sign(sin) * Math.abs(sin) ** bulge
    seedX[index] = centerX + unitX * rx * node.seedT + jitter
    seedY[index] = centerY + unitY * ry * node.seedT - jitter
    node.x = seedX[index]
    node.y = seedY[index]
  })

  const pad = (COLLISION_PAD * scale) / 2
  const count = placed.length

  // Every node keeps an elliptical footprint. Skill captions only appear under
  // the cursor, so those are pure circles; the always-on profile / experience /
  // category captions reserve their own width and height instead.
  const halfWidth = new Float64Array(count)
  const halfHeight = new Float64Array(count)
  placed.forEach((node, index) => {
    const captioned = node.type === 'experience' || node.type === 'category'
    const labelHalf = captioned ? approxTextWidth(node.short, node.fontSize) / 2 + 3 : 0
    const labelBand = captioned ? node.fontSize + 7 : 0
    halfWidth[index] = Math.max(node.r, labelHalf) + node.spanX * DRIFT_CLEARANCE + pad
    halfHeight[index] = node.r + labelBand + node.spanY * DRIFT_CLEARANCE + pad
  })

  const resolveCollisions = (strength: number) => {
    for (let i = 0; i < count; i += 1) {
      const a = placed[i]
      for (let j = i + 1; j < count; j += 1) {
        const b = placed[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const sumW = halfWidth[i] + halfWidth[j]
        const sumH = halfHeight[i] + halfHeight[j]
        const nx = dx / sumW
        const ny = dy / sumH
        const normSq = nx * nx + ny * ny
        if (normSq >= 1) continue
        // Scaling the separation vector by 1/norm puts the pair exactly on the
        // boundary of their combined footprint.
        const norm = Math.sqrt(normSq) || 0.0001
        const push = ((1 - norm) / norm) * strength * 0.5
        const ox = dx * push
        const oy = dy * push
        // The profile node is pinned, so it absorbs none of the correction.
        if (a.type === 'profile') {
          b.x += ox * 2
          b.y += oy * 2
        } else if (b.type === 'profile') {
          a.x -= ox * 2
          a.y -= oy * 2
        } else {
          a.x -= ox
          a.y -= oy
          b.x += ox
          b.y += oy
        }
      }
    }
  }

  const applyBounds = () => {
    for (let i = 0; i < count; i += 1) {
      const node = placed[i]
      node.x = clamp(node.x, minX[i], maxX[i])
      node.y = clamp(node.y, minY[i], maxY[i])
    }
  }

  for (let step = 0; step < RELAX_STEPS; step += 1) {
    for (let i = 0; i < count; i += 1) {
      const node = placed[i]
      const pull = SEED_PULL[node.type]
      node.x += (seedX[i] - node.x) * pull
      node.y += (seedY[i] - node.y) * pull
    }
    resolveCollisions(0.5)
    applyBounds()
  }

  // Collision-only cool-down guarantees the final frame has no forced overlap.
  for (let step = 0; step < SETTLE_STEPS; step += 1) {
    resolveCollisions(0.5)
    applyBounds()
  }

  placed.forEach((node) => {
    node.x = Math.round(node.x * 10) / 10
    node.y = Math.round(node.y * 10) / 10
    if (node.type === 'profile') {
      node.labelDy = node.fontSize * 0.35
      return
    }
    // Labels sit radially outward: above in the top half, below in the bottom
    // half. Neighbouring skills alternate lanes so a revealed cluster doesn't
    // stack all of its captions on one line.
    const stagger = node.lane * (node.fontSize + 5)
    node.labelDy = round(
      node.y >= centerY ? node.r + node.fontSize + 3 + stagger : -(node.r + 8 + stagger),
    )
  })

  return placed
}

export default function KnowledgeGraph() {
  const [activeNodeId, setActiveNodeId] = useState(PROFILE_ID)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const groupRefs = useRef<(SVGGElement | null)[]>([])
  const circleRefs = useRef<(SVGCircleElement | null)[]>([])
  const labelRefs = useRef<(SVGTextElement | null)[]>([])
  const edgeRefs = useRef<(SVGLineElement | null)[]>([])
  const connectedRef = useRef<Set<string>>(new Set())
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const activeIndexRef = useRef(0)

  const { nodes, edges } = useMemo(() => buildGraph(), [])

  const layout = useMemo(
    () => (size.width > 0 && size.height > 0 ? layoutGraph(nodes, size.width, size.height) : []),
    [nodes, size.width, size.height],
  )

  const indexById = useMemo(() => new Map(layout.map((node, index) => [node.id, index])), [layout])

  // Flat endpoint indices, so the frame loop can move the edges with the nodes
  // without touching the edge objects or React.
  const edgeEnds = useMemo(() => {
    const source = new Int32Array(edges.length)
    const target = new Int32Array(edges.length)
    edges.forEach((edge, index) => {
      source[index] = indexById.get(edge.source) ?? -1
      target[index] = indexById.get(edge.target) ?? -1
    })
    return { source, target }
  }, [edges, indexById])
  const activeNode = layout[indexById.get(activeNodeId) ?? 0]

  const connectedIds = useMemo(() => {
    const ids = new Set<string>([activeNodeId])
    edges.forEach((edge) => {
      if (edge.source === activeNodeId) ids.add(edge.target)
      if (edge.target === activeNodeId) ids.add(edge.source)
    })
    return ids
  }, [edges, activeNodeId])

  useLayoutEffect(() => {
    activeIndexRef.current = indexById.get(activeNodeId) ?? 0
    connectedRef.current = connectedIds
  }, [indexById, activeNodeId, connectedIds])

  // Measure the canvas so the viewBox maps 1:1 to CSS pixels and the layout can
  // be recomputed for whatever space the breakpoint actually gives us.
  useLayoutEffect(() => {
    const element = canvasRef.current
    if (!element) return

    const measure = () => {
      const rect = element.getBoundingClientRect()
      // Snapped to 8px so a drag-resize doesn't rerun the relaxation every pixel.
      const width = Math.round(rect.width / 8) * 8
      const height = Math.round(rect.height / 8) * 8
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Idle drift + cursor-proximity scaling, driven straight onto the DOM so the
  // 90-odd nodes never cause a React render per frame.
  useLayoutEffect(() => {
    if (layout.length === 0) return
    const edgeCount = edgeEnds.source.length

    const scales = new Float64Array(layout.length).fill(1)
    const reveals = new Float64Array(layout.length)
    // Live positions, shared with the edge pass below.
    const driftX = new Float64Array(layout.length)
    const driftY = new Float64Array(layout.length)

    // Frame-rate independent easing factor, recomputed each tick.
    let easing = 1
    // 1 normally, lower when the visitor asked for reduced motion.
    let amplitude = 1

    const paint = (elapsed: number) => {
      const pointer = pointerRef.current
      const connected = connectedRef.current

      for (let i = 0; i < layout.length; i += 1) {
        const node = layout[i]

        // Two sines per axis at unrelated rates: the path wanders instead of
        // tracing the same little ellipse over and over.
        const waveX =
          Math.sin(elapsed * node.freqX + node.phaseX) +
          DRIFT_HARMONIC * Math.sin(elapsed * node.freqX * DRIFT_HARMONIC_RATE + node.harmonicX)
        const waveY =
          Math.sin(elapsed * node.freqY + node.phaseY) +
          DRIFT_HARMONIC * Math.sin(elapsed * node.freqY * DRIFT_HARMONIC_RATE + node.harmonicY)
        const x = node.x + waveX * node.ampX * amplitude
        const y = node.y + waveY * node.ampY * amplitude
        // Recorded before the ref check so the edge pass always has endpoints.
        driftX[i] = x
        driftY[i] = y

        const group = groupRefs.current[i]
        if (!group) continue
        group.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)

        // How close the cursor is, 0 outside the field and 1 dead centre.
        let proximity = 0
        if (pointer) {
          const dx = pointer.x - x
          const dy = pointer.y - y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < node.hoverReach) {
            const t = 1 - distance / node.hoverReach
            proximity = t * t * (3 - 2 * t) // smoothstep — gentle at the rim
          }
        }

        let target = 1 + HOVER_GAIN * proximity
        if (i === activeIndexRef.current) target += ACTIVE_GAIN

        // Snap once the easing tail is imperceptible, otherwise a node can rest
        // a hair off its target forever.
        const next = Math.abs(target - scales[i]) < 0.002 ? target : scales[i] + (target - scales[i]) * easing
        if (next !== scales[i]) {
          scales[i] = next
          const circle = circleRefs.current[i]
          if (circle) circle.setAttribute('transform', `scale(${next.toFixed(3)})`)
        }

        if (node.type !== 'skill') continue
        const label = labelRefs.current[i]
        if (!label) continue
        let reveal = connected.has(node.id) ? 1 : 0
        if (reveal < 1 && pointer) {
          const dx = pointer.x - x
          const dy = pointer.y - y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < node.labelReach) {
            const t = 1 - distance / node.labelReach
            reveal = t * t * (3 - 2 * t)
          }
        }
        const nextReveal =
          Math.abs(reveal - reveals[i]) < 0.004 ? reveal : reveals[i] + (reveal - reveals[i]) * easing
        if (nextReveal !== reveals[i]) {
          reveals[i] = nextReveal
          label.style.opacity = nextReveal.toFixed(3)
        }
      }

      // Edges trail their endpoints, so the web stretches with the drift.
      for (let e = 0; e < edgeCount; e += 1) {
        const line = edgeRefs.current[e]
        if (!line) continue
        const from = edgeEnds.source[e]
        const to = edgeEnds.target[e]
        if (from < 0 || to < 0) continue
        line.setAttribute('x1', driftX[from].toFixed(1))
        line.setAttribute('y1', driftY[from].toFixed(1))
        line.setAttribute('x2', driftX[to].toFixed(1))
        line.setAttribute('y2', driftY[to].toFixed(1))
      }
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let last = 0
    // Accumulated drift time, so pausing and resuming never jumps the phase.
    let elapsed = 0
    let running = false
    let onScreen = true

    const tick = (now: number) => {
      const delta = last === 0 ? 16.7 : Math.min(now - last, 64)
      last = now
      // Reduced motion damps the drift instead of stopping it — the graph still
      // reads as alive, just slower and with a shorter throw.
      const reduced = reduceMotion.matches
      amplitude = reduced ? REDUCED_AMPLITUDE : 1
      elapsed += reduced ? delta * REDUCED_SPEED : delta
      easing = 1 - Math.exp(-delta / SCALE_EASE)
      paint(elapsed)
      frame = requestAnimationFrame(tick)
    }

    // The loop only runs while the graph is both on screen and in a visible tab.
    const sync = () => {
      const shouldRun = onScreen && !document.hidden
      if (shouldRun === running) return
      running = shouldRun
      if (shouldRun) {
        last = 0
        frame = requestAnimationFrame(tick)
      } else {
        cancelAnimationFrame(frame)
      }
    }

    // Paint the seeded positions before the browser's first frame so nothing
    // flashes at the origin.
    easing = 1
    amplitude = reduceMotion.matches ? REDUCED_AMPLITUDE : 1
    paint(0)
    sync()

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0 },
    )
    if (canvasRef.current) observer.observe(canvasRef.current)

    document.addEventListener('visibilitychange', sync)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [layout, edgeEnds])

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    pointerRef.current = {
      x: ((event.clientX - rect.left) / rect.width) * svg.viewBox.baseVal.width,
      y: ((event.clientY - rect.top) / rect.height) * svg.viewBox.baseVal.height,
    }
  }, [])

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null
  }, [])

  return (
    <section className="knowledge-graph-section" aria-labelledby="knowledge-graph-title">
      <div className="knowledge-graph-header">
        <h2 id="knowledge-graph-title" className="knowledge-graph-title">
          Knowledge Graph
        </h2>
        <p className="knowledge-graph-subtitle">
          A mapped view of how my skills connect to education, research, and work experience.
        </p>
      </div>

      <div className="knowledge-graph-layout">
        <div className="knowledge-graph-canvas" ref={canvasRef}>
          {size.width > 0 ? (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${size.width} ${size.height}`}
              className="knowledge-graph-svg"
              role="group"
              aria-label="Interactive knowledge graph of skills and experiences"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              {edges.map((edge, index) => {
                const source = layout[indexById.get(edge.source) ?? -1]
                const target = layout[indexById.get(edge.target) ?? -1]
                if (!source || !target) return null
                const highlighted = connectedIds.has(source.id) && connectedIds.has(target.id)

                return (
                  <line
                    key={`${edge.source}-${edge.target}`}
                    ref={(element) => {
                      edgeRefs.current[index] = element
                    }}
                    className={highlighted ? 'graph-edge is-active' : 'graph-edge'}
                  />
                )
              })}

              {layout.map((node, index) => {
                const active = node.id === activeNodeId
                const connected = connectedIds.has(node.id)

                return (
                  <g
                    key={node.id}
                    ref={(element) => {
                      groupRefs.current[index] = element
                    }}
                    className={`graph-node graph-node-${node.type}${active ? ' is-active' : ''}${
                      connected ? ' is-connected' : ''
                    }`}
                    onMouseEnter={() => setActiveNodeId(node.id)}
                    onClick={() => setActiveNodeId(node.id)}
                    onFocus={() => setActiveNodeId(node.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${node.label}: ${node.description ?? node.type}`}
                  >
                    <circle className="graph-node-halo" r={node.r * 1.85} fill={node.color} />
                    <circle
                      ref={(element) => {
                        circleRefs.current[index] = element
                      }}
                      r={node.r}
                      fill={node.color}
                    />
                    <text
                      ref={(element) => {
                        labelRefs.current[index] = element
                      }}
                      className="graph-node-label"
                      textAnchor="middle"
                      y={node.labelDy}
                      fontSize={node.fontSize}
                      strokeWidth={node.haloWidth}
                    >
                      {node.short}
                    </text>
                  </g>
                )
              })}
            </svg>
          ) : null}
        </div>

        <aside className="knowledge-graph-panel" aria-live="polite">
          {activeNode ? (
            <>
              <span className={`graph-panel-type graph-panel-type-${activeNode.type}`}>
                {activeNode.type}
              </span>
              <h3>{activeNode.label}</h3>
              {activeNode.description && <p>{activeNode.description}</p>}
              {activeNode.meta && <p className="graph-panel-meta">{activeNode.meta}</p>}
              <div className="graph-panel-count">
                {connectedIds.size - 1} direct connection{connectedIds.size === 2 ? '' : 's'}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

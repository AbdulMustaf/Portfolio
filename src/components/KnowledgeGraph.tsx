import { useMemo, useState } from 'react'
import { experienceData } from '../data/experienceData'
import { skillsData } from '../data/skillsData'

type NodeType = 'profile' | 'experience' | 'category' | 'skill'

interface GraphNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  size: number
  color: string
  description?: string
  meta?: string
}

interface GraphEdge {
  source: string
  target: string
}

const WIDTH = 960
const HEIGHT = 640
const VIEWBOX_PADDING = 76
const CENTER_X = WIDTH / 2
const CENTER_Y = HEIGHT / 2

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

function pointOnCircle(index: number, total: number, radius: number, offset = -Math.PI / 2) {
  const angle = offset + (index / total) * Math.PI * 2
  return {
    x: CENTER_X + Math.cos(angle) * radius,
    y: CENTER_Y + Math.sin(angle) * radius,
  }
}

function shortLabel(label: string, max = 18) {
  return label.length > max ? `${label.slice(0, max - 1)}...` : label
}

export default function KnowledgeGraph() {
  const [activeNodeId, setActiveNodeId] = useState('profile-mufasa')

  const graph = useMemo(() => {
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
    const nodes: GraphNode[] = [
      {
        id: 'profile-mufasa',
        label: 'Abdullah',
        type: 'profile',
        x: CENTER_X,
        y: CENTER_Y,
        size: 64,
        color: '#ffffff',
        description: 'Portfolio knowledge graph root',
        meta: 'Skills, education, research, and work experience',
      },
    ]
    const edges: GraphEdge[] = []

    experienceData.forEach((experience, index) => {
      const radius = 170
      const angle = -Math.PI / 2 + ((index + 0.5) / experienceData.length) * Math.PI * 2
      const node: GraphNode = {
        id: `experience-${experience.id}`,
        label: experience.org,
        type: 'experience',
        x: CENTER_X + Math.cos(angle) * radius,
        y: CENTER_Y + Math.sin(angle) * radius,
        size: 46,
        color: experience.type === 'Education' ? '#f472b6' : experience.type === 'Research' ? '#a78bfa' : '#38bdf8',
        description: experience.role,
        meta: `${experience.type} | ${experience.dates}`,
      }
      nodes.push(node)
      edges.push({ source: 'profile-mufasa', target: node.id })
    })

    categories.forEach((category, index) => {
      const position = pointOnCircle(index, categories.length, 250)
      const node: GraphNode = {
        id: `category-${toId(category)}`,
        label: category,
        type: 'category',
        x: position.x,
        y: position.y,
        size: 38,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        description: `${categorySkillMap.get(category)?.length ?? 0} mapped skills`,
      }
      nodes.push(node)
      edges.push({ source: 'profile-mufasa', target: node.id })
    })

    categories.forEach((category, categoryIndex) => {
      const skills = [...(categorySkillMap.get(category) ?? [])].sort()
      const arcStart = -Math.PI / 2 + (categoryIndex / categories.length) * Math.PI * 2 - 0.22
      const arcSpread = 0.44

      skills.forEach((skill, skillIndex) => {
        const angle = arcStart + (skills.length === 1 ? arcSpread / 2 : (skillIndex / (skills.length - 1)) * arcSpread)
        const radius = 305 + (skillIndex % 2) * 44
        const node: GraphNode = {
          id: `skill-${toId(skill)}`,
          label: skill,
          type: 'skill',
          x: CENTER_X + Math.cos(angle) * radius,
          y: CENTER_Y + Math.sin(angle) * radius,
          size: 28,
          color: CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length],
          description: `Part of ${category}`,
          meta: experienceData
            .filter((experience) => experience.tech.map((tech) => SKILL_ALIASES[tech] ?? tech).includes(skill))
            .map((experience) => experience.org)
            .join(', ') || 'Listed skill',
        }
        nodes.push(node)
        edges.push({ source: `category-${toId(category)}`, target: node.id })
      })
    })

    experienceData.forEach((experience) => {
      experience.tech.forEach((tech) => {
        const skill = SKILL_ALIASES[tech] ?? tech
        edges.push({
          source: `experience-${experience.id}`,
          target: `skill-${toId(skill)}`,
        })
      })
    })

    const nodeById = new Map(nodes.map((node) => [node.id, node]))
    return { nodes, edges, nodeById }
  }, [])

  const activeNode = graph.nodeById.get(activeNodeId) ?? graph.nodes[0]
  const connectedIds = new Set<string>([activeNode.id])
  graph.edges.forEach((edge) => {
    if (edge.source === activeNode.id) connectedIds.add(edge.target)
    if (edge.target === activeNode.id) connectedIds.add(edge.source)
  })

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
        <div className="knowledge-graph-canvas" role="img" aria-label="Interactive knowledge graph of skills and experiences">
          <svg
            viewBox={`${-VIEWBOX_PADDING} ${-VIEWBOX_PADDING} ${WIDTH + VIEWBOX_PADDING * 2} ${HEIGHT + VIEWBOX_PADDING * 2}`}
            className="knowledge-graph-svg"
          >
            <defs>
              <filter id="graphGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {graph.edges.map((edge) => {
              const source = graph.nodeById.get(edge.source)
              const target = graph.nodeById.get(edge.target)
              if (!source || !target) return null
              const highlighted = connectedIds.has(source.id) && connectedIds.has(target.id)

              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={highlighted ? 'graph-edge is-active' : 'graph-edge'}
                />
              )
            })}

            {graph.nodes.map((node) => {
              const active = node.id === activeNode.id
              const connected = connectedIds.has(node.id)

              return (
                <g
                  key={node.id}
                  className={`graph-node graph-node-${node.type}${active ? ' is-active' : ''}${connected ? ' is-connected' : ''}`}
                  transform={`translate(${node.x} ${node.y})`}
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  onFocus={() => setActiveNodeId(node.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.label}: ${node.description ?? node.type}`}
                >
                  <circle
                    r={node.size / 2}
                    fill={node.color}
                    filter={active ? 'url(#graphGlow)' : undefined}
                  />
                  <text className="graph-node-label" textAnchor="middle" y={node.type === 'profile' ? 4 : node.size / 2 + 16}>
                    {shortLabel(node.label, node.type === 'skill' ? 14 : 18)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <aside className="knowledge-graph-panel" aria-live="polite">
          <span className={`graph-panel-type graph-panel-type-${activeNode.type}`}>
            {activeNode.type}
          </span>
          <h3>{activeNode.label}</h3>
          {activeNode.description && <p>{activeNode.description}</p>}
          {activeNode.meta && <p className="graph-panel-meta">{activeNode.meta}</p>}
          <div className="graph-panel-count">
            {connectedIds.size - 1} direct connection{connectedIds.size === 2 ? '' : 's'}
          </div>
        </aside>
      </div>
    </section>
  )
}

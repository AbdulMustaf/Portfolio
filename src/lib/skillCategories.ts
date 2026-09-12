/**
 * Shared mapping from an individual skill or tech tag to its category colour.
 *
 * Used by the knowledge graph and the experience timeline so the same skill
 * carries the same colour everywhere on the site.
 */

import { skillsData } from '../data/skillsData'

/** Indexed by position in skillsData, so a category's colour is stable. */
export const CATEGORY_COLORS = [
  '#e50914', // Languages
  '#f5a524', // Frontend
  '#2dd4bf', // Backend & APIs
  '#38bdf8', // AI / ML
  '#a78bfa', // Time-Series & Signals
  '#f472b6', // Statistics & Research
  '#84cc16', // DevOps & Tools
  '#fb7185', // Testing & QA
  '#94a3b8', // Product & Design
]

/** Tags with no category — coursework and general topics — render muted. */
export const NEUTRAL_COLOR = '#8a8a8a'

/**
 * Experience tags that don't appear verbatim in skillsData.
 *
 * Deliberately partial: academic subjects (Algorithms, Data Structures,
 * Operating Systems, Networking) are left unmapped so coursework reads as
 * muted rather than being forced into a tooling category it doesn't belong to.
 */
const TECH_CATEGORY: Record<string, string> = {
  AI: 'AI / ML',
  Testing: 'Testing & QA',
  UAT: 'Testing & QA',
  QA: 'Testing & QA',
  'Requirements Traceability': 'Testing & QA',
  Git: 'DevOps & Tools',
  Linux: 'DevOps & Tools',
  SharePoint: 'DevOps & Tools',
  'Reporting Automation': 'DevOps & Tools',
  'Data Analysis': 'Statistics & Research',
}

// Built once at module load: lowercased skill name → category name.
const skillToCategory = new Map<string, string>()
for (const group of skillsData) {
  for (const skill of group.skills) {
    skillToCategory.set(skill.toLowerCase(), group.category)
  }
}
for (const [tech, category] of Object.entries(TECH_CATEGORY)) {
  skillToCategory.set(tech.toLowerCase(), category)
}

const categoryIndex = new Map<string, number>()
skillsData.forEach((group, index) => categoryIndex.set(group.category, index))

/** Category a tag belongs to, or null when it is uncategorised. */
export function categoryOfTech(tech: string): string | null {
  return skillToCategory.get(tech.toLowerCase()) ?? null
}

/** Colour for a tag; NEUTRAL_COLOR when the tag has no category. */
export function colorForTech(tech: string): string {
  const category = categoryOfTech(tech)
  if (!category) return NEUTRAL_COLOR
  const index = categoryIndex.get(category)
  return index === undefined ? NEUTRAL_COLOR : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

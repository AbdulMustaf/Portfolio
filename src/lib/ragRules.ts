/**
 * Rule-based portfolio Q&A engine.
 *
 * Shared by the frontend fallback (src/api/terminalApi.ts) and the server-side
 * fallback in api/rag-chat.ts.  Data is injected via RagData so the module
 * contains only logic and has no direct data imports.
 */

import type { Experience } from '../data/experienceData'
import type { Project } from '../data/projectsData'
import type { SkillCategory } from '../data/skillsData'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface RagProfile {
  name: string
  bio: string
  location: string
  email: string
  github: string
  linkedin: string
  resumeUrl: string
}

export interface RagData {
  profile: RagProfile
  experience: Experience[]
  projects: Project[]
  skills: SkillCategory[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function has(q: string, ...terms: string[]): boolean {
  return terms.some(t => q.includes(t))
}

function workRoles(experience: Experience[]): Experience[] {
  return experience.filter(e => e.type !== 'Education')
}

function currentRole(experience: Experience[]): Experience | undefined {
  return experience.find(
    e => e.type !== 'Education' && e.dates.toLowerCase().includes('present'),
  )
}

/** Returns a project whose full title appears verbatim in the query. */
function findProject(q: string, projects: Project[]): Project | undefined {
  return projects.find(p => q.includes(p.title.toLowerCase()))
}

/** Returns an experience whose full org name appears verbatim in the query. */
function findExperience(q: string, experience: Experience[]): Experience | undefined {
  return experience.find(e => q.includes(e.orgFull.toLowerCase()))
}

/** Returns the first skill (and its category) whose name appears in the query. */
function findSkill(q: string, skills: SkillCategory[]): { category: string; skill: string } | undefined {
  for (const cat of skills) {
    for (const skill of cat.skills) {
      if (q.includes(skill.toLowerCase())) {
        return { category: cat.category, skill }
      }
    }
  }
  return undefined
}

/** Strips the accidental literal "/n" left in the bio and trims whitespace. */
function cleanBio(raw: string): string {
  return raw
    .replace(/\s*\/n\s*/g, ' ')
    .replace(/\n\s{2,}/g, '\n')
    .trim()
}

// ─── Rule engine ──────────────────────────────────────────────────────────────

/**
 * Returns a natural-language answer to `message` derived entirely from `data`.
 * Rules are evaluated in priority order; the first match wins.
 */
export function ruleBasedAnswer(message: string, data: RagData): string {
  const q = message.toLowerCase().trim()
  const first = data.profile.name.split(' ')[0]          // "Abdullah"
  const firstLower = first.toLowerCase()                  // "abdullah"

  // ── 1. Greeting ────────────────────────────────────────────────────────────
  if (
    ['hi', 'hello', 'hey', 'yo', 'sup', 'howdy'].includes(q) ||
    has(q, 'hello there', 'hey there', 'hi there', 'greetings', "what's up", 'whats up')
  ) {
    return (
      `Hey! I'm a portfolio assistant for ${data.profile.name}. ` +
      `Ask me about his education, work experience, projects, skills, or how to get in touch.`
    )
  }

  // ── 2. Resume ──────────────────────────────────────────────────────────────
  if (has(q, 'resume', ' cv', 'curriculum vitae', '.pdf')) {
    return (
      `You can view or download ${first}'s resume from the home page, ` +
      `or go to ${data.profile.resumeUrl} directly.`
    )
  }

  // ── 3. Contact ─────────────────────────────────────────────────────────────
  if (has(q, 'contact', 'email', 'reach', 'get in touch', 'linkedin', 'github', 'social media', 'message him')) {
    return [
      `Here's how to reach ${data.profile.name}:`,
      `• Email: ${data.profile.email}`,
      `• LinkedIn: ${data.profile.linkedin}`,
      `• GitHub: ${data.profile.github}`,
    ].join('\n')
  }

  // ── 4. Specific project (full title match) ─────────────────────────────────
  const project = findProject(q, data.projects)
  if (project) {
    const lines: string[] = [
      `${project.title} — ${project.subtitle} (${project.year})`,
      project.longDescription,
      `Tech: ${project.tags.join(', ')}`,
    ]
    if (project.githubUrl) lines.push(`GitHub: ${project.githubUrl}`)
    if (project.liveUrl) lines.push(`Live: ${project.liveUrl}`)
    return lines.join('\n')
  }

  // ── 5. Specific experience (full org-name match) ───────────────────────────
  const specificExp = findExperience(q, data.experience)
  if (specificExp && specificExp.type !== 'Education') {
    return [
      `${first} worked as ${specificExp.role} at ${specificExp.orgFull} (${specificExp.type}, ${specificExp.dates}):`,
      ...specificExp.highlights.map(h => `• ${h}`),
      specificExp.tech.length ? `Tech: ${specificExp.tech.join(', ')}` : '',
    ].filter(Boolean).join('\n')
  }

  // ── 6. Current role ────────────────────────────────────────────────────────
  const current = currentRole(data.experience)
  if (
    has(q, 'current', 'currently', 'right now', 'at the moment') &&
    has(q, 'job', 'role', 'position', 'work', 'doing', 'employed')
  ) {
    if (!current) return `The portfolio doesn't list a current role at this time.`
    return [
      `${first} is currently a ${current.role} at ${current.orgFull} (${current.type}, ${current.dates}).`,
      ...current.highlights.slice(0, 2).map(h => `• ${h}`),
    ].join('\n')
  }

  // ── 7. "What does he do" / "what is his job" ───────────────────────────────
  if (has(q,
    'what does he do', `what does ${firstLower} do`,
    'what is his job', 'what is his role', 'what is he doing',
  )) {
    if (current) {
      const line = `${first} is currently a ${current.role} at ${current.orgFull}.`
      return current.highlights[0] ? `${line} ${current.highlights[0]}` : line
    }
    return cleanBio(data.profile.bio)
  }

  // ── 8. "Where does he work" ────────────────────────────────────────────────
  if (has(q,
    'where does he work', `where does ${firstLower} work`,
    'where is he working', 'what company', 'which company', 'which organization',
  )) {
    if (current) {
      return `${first} is currently at ${current.orgFull}, working as a ${current.role} (${current.dates}).`
    }
    const jobs = workRoles(data.experience)
    if (jobs.length) return `Most recently, ${first} worked at ${jobs[0].orgFull} as a ${jobs[0].role}.`
    return `The portfolio doesn't include current workplace information.`
  }

  // ── 9. Specific skill query ("does he know React?") ───────────────────────
  // Checked before the general work-experience rule so "experience with X"
  // returns a skill answer rather than the work history list.
  const skillHit = findSkill(q, data.skills)
  if (skillHit && has(q,
    'know', 'use', 'familiar', 'proficient', 'work with',
    'experience', 'does he', 'can he', 'has he', 'good at',
  )) {
    return `Yes — ${skillHit.skill} is part of ${first}'s ${skillHit.category} skill set. Visit the Skills page to see the full stack.`
  }

  // ── 10. Availability / open to work ───────────────────────────────────────
  if (has(q, 'available', 'availability', 'open to work', 'looking for', 'hire him', 'hiring', 'opportunity', 'new grad', 'full-time', 'full time')) {
    return (
      `${first} is a CS co-op student at Ontario Tech University and is open to co-op and internship opportunities. ` +
      `Best way to reach him: ${data.profile.email} or LinkedIn.`
    )
  }

  // ── 11. Work experience (general list) ────────────────────────────────────
  if (has(q, 'work history', 'work experience', 'jobs', 'employment', 'career', 'internship', 'intern', 'co-op', 'coop', 'previous role', 'experience')) {
    const jobs = workRoles(data.experience)
    return [
      `${first}'s work experience:`,
      ...jobs.map(e => `• ${e.role} @ ${e.orgFull} (${e.type}, ${e.dates})`),
    ].join('\n')
  }

  // ── 12. Education ─────────────────────────────────────────────────────────
  if (has(q, 'school', 'university', 'college', 'degree', 'studying', 'student', 'education', 'program', 'otu', 'ontario tech', 'undergrad', 'academic')) {
    const edu = data.experience.find(e => e.type === 'Education')
    if (edu) {
      return `${first} is studying ${edu.role} at ${edu.orgFull} (${edu.dates}). ${edu.description}`.trim()
    }
    return `${first} is a Computer Science student at Ontario Tech University in Oshawa, Ontario.`
  }

  // ── 13. Projects (general list) ───────────────────────────────────────────
  if (has(q, 'project', 'built', 'build', 'made', 'what has he', 'his work', 'apps', 'software', 'portfolio')) {
    const list = data.projects.map(p => `• ${p.title} — ${p.subtitle}`).join('\n')
    return `${first} has built:\n${list}\n\nAsk about any specific project for more details!`
  }

  // ── 14. Skills overview ───────────────────────────────────────────────────
  if (has(q,
    'skill', 'tech stack', 'technologies', 'what does he know', 'what can he do', 'what tech',
    'framework', 'tool', 'stack', 'proficient', 'good at',
    'frontend', 'backend', 'ai ', ' ml ', 'machine learning', 'devops', 'testing',
  )) {
    const summary = data.skills.map(c => `${c.icon} ${c.category}: ${c.skills.join(', ')}`).join('\n')
    return `${first}'s tech stack:\n${summary}`
  }

  // ── 15. Awards / achievements ─────────────────────────────────────────────
  if (has(q, 'award', 'achievement', 'win', 'won', "dean's list", 'deans list', 'hackathon', 'competition', 'honour', 'honor', 'prize', 'recognition')) {
    const edu = data.experience.find(e => e.type === 'Education')
    if (edu?.highlights.length) {
      return `${first}'s recognitions:\n${edu.highlights.map(h => `• ${h}`).join('\n')}`
    }
    return `The portfolio highlights academic excellence and competition wins — check the home page for details.`
  }

  // ── 16. Location ──────────────────────────────────────────────────────────
  // Checked after the work-specific "where does he work" rule (rule 8) so
  // "where does he work?" is never swallowed by this generic location handler.
  if (
    has(q, 'location', 'based', 'live', 'city', 'country', 'oshawa', 'toronto') ||
    (q.includes('where') && !q.includes('work'))
  ) {
    return `${first} is based in ${data.profile.location}.`
  }

  // ── 17. About / identity ──────────────────────────────────────────────────
  if (has(q, 'who is', 'who are', 'tell me about', 'about him', 'about you', 'introduce', 'bio', 'background', 'describe', 'summary')) {
    return cleanBio(data.profile.bio)
  }

  // ── 18. Unknown ───────────────────────────────────────────────────────────
  return (
    `That information isn't in ${first}'s portfolio. ` +
    `Try asking about his education, work experience, projects, skills, contact info, or awards.`
  )
}

/**
 * Rule-based portfolio Q&A engine.
 *
 * Shared by the frontend fallback (src/api/terminalApi.ts) and the server
 * (api/rag-chat.ts), where it serves two jobs: the answer of last resort when
 * the model is unavailable or over budget, and — for intents whose answer is a
 * plain data lookup — the *preferred* answer, since it costs nothing and
 * cannot hallucinate.
 *
 * resolveRule() reports which rule fired so the caller can tell a confident
 * match from the catch-all, and decide whether a model call is worth paying
 * for. Data is injected via RagData so this module stays logic-only.
 */

import type { Award } from '../data/awardsData'
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
  awards: Award[]
}

/** Identifier of the rule that produced an answer; 'unknown' means no match. */
export type RuleId =
  | 'greeting'
  | 'resume'
  | 'contact'
  | 'project-specific'
  | 'experience-specific'
  | 'current-role'
  | 'what-he-does'
  | 'where-he-works'
  | 'skill-specific'
  | 'availability'
  | 'work-list'
  | 'education'
  | 'projects-list'
  | 'skills-overview'
  | 'awards'
  | 'location'
  | 'about'
  | 'unknown'

export interface RuleResult {
  answer: string
  rule: RuleId
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function has(q: string, ...terms: string[]): boolean {
  return terms.some(t => q.includes(t))
}

function workRoles(experience: Experience[]): Experience[] {
  return experience.filter(e => e.type !== 'Education')
}

/**
 * All active non-education roles.
 *
 * Returns an array rather than the first match: the portfolio legitimately
 * lists concurrent roles (research alongside a co-op placement), and answering
 * "where does he work?" with only the first silently hides the other.
 */
function currentRoles(experience: Experience[]): Experience[] {
  return experience.filter(
    e => e.type !== 'Education' && /present|current/i.test(e.dates),
  )
}

/** Joins roles into a readable clause: "A at X, and B at Y". */
function describeRoles(roles: Experience[]): string {
  const parts = roles.map(r => `${r.role} at ${r.orgFull} (${r.type}, ${r.dates})`)
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join('; ')}; and ${parts[parts.length - 1]}`
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
 * Resolves `message` against `data`, reporting the matching rule.
 * Rules are evaluated in priority order; the first match wins.
 */
export function resolveRule(message: string, data: RagData): RuleResult {
  const q = message.toLowerCase().trim()
  const first = data.profile.name.split(' ')[0]          // "Abdullah"
  const firstLower = first.toLowerCase()                  // "abdullah"
  const active = currentRoles(data.experience)

  // ── 1. Greeting ────────────────────────────────────────────────────────────
  if (
    ['hi', 'hello', 'hey', 'yo', 'sup', 'howdy'].includes(q) ||
    has(q, 'hello there', 'hey there', 'hi there', 'greetings', "what's up", 'whats up')
  ) {
    return {
      rule: 'greeting',
      answer:
        `Hey! I'm a portfolio assistant for ${data.profile.name}. ` +
        `Ask me about his education, work experience, projects, skills, or how to get in touch.`,
    }
  }

  // ── 2. Resume ──────────────────────────────────────────────────────────────
  if (has(q, 'resume', ' cv', 'curriculum vitae', '.pdf')) {
    return {
      rule: 'resume',
      answer:
        `You can view or download ${first}'s resume from the home page, ` +
        `or go to ${data.profile.resumeUrl} directly.`,
    }
  }

  // ── 3. Contact ─────────────────────────────────────────────────────────────
  if (has(q, 'contact', 'email', 'reach', 'get in touch', 'linkedin', 'github', 'social media', 'message him')) {
    return {
      rule: 'contact',
      answer: [
        `Here's how to reach ${data.profile.name}:`,
        `• Email: ${data.profile.email}`,
        `• LinkedIn: ${data.profile.linkedin}`,
        `• GitHub: ${data.profile.github}`,
      ].join('\n'),
    }
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
    return { rule: 'project-specific', answer: lines.join('\n') }
  }

  // ── 5. Specific experience (full org-name match) ───────────────────────────
  const specificExp = findExperience(q, data.experience)
  if (specificExp && specificExp.type !== 'Education') {
    return {
      rule: 'experience-specific',
      answer: [
        `${first} worked as ${specificExp.role} at ${specificExp.orgFull} (${specificExp.type}, ${specificExp.dates}):`,
        ...specificExp.highlights.map(h => `• ${h}`),
        specificExp.tech.length ? `Tech: ${specificExp.tech.join(', ')}` : '',
      ].filter(Boolean).join('\n'),
    }
  }

  // ── 6. Current role ────────────────────────────────────────────────────────
  if (
    has(q, 'current', 'currently', 'right now', 'at the moment') &&
    has(q, 'job', 'role', 'position', 'work', 'doing', 'employed')
  ) {
    if (!active.length) {
      return { rule: 'current-role', answer: `The portfolio doesn't list a current role at this time.` }
    }
    return {
      rule: 'current-role',
      answer: [
        active.length === 1
          ? `${first} is currently ${describeRoles(active)}.`
          : `${first} is currently juggling ${active.length} roles: ${describeRoles(active)}.`,
        ...active.flatMap(role => role.highlights.slice(0, 1).map(h => `• ${h}`)),
      ].join('\n'),
    }
  }

  // ── 7. "What does he do" / "what is his job" ───────────────────────────────
  if (has(q,
    'what does he do', `what does ${firstLower} do`,
    'what is his job', 'what is his role', 'what is he doing',
  )) {
    if (active.length) {
      const line = `${first} is currently ${describeRoles(active)}.`
      const highlight = active[0].highlights[0]
      return { rule: 'what-he-does', answer: highlight ? `${line} ${highlight}` : line }
    }
    return { rule: 'what-he-does', answer: cleanBio(data.profile.bio) }
  }

  // ── 8. "Where does he work" ────────────────────────────────────────────────
  if (has(q,
    'where does he work', `where does ${firstLower} work`,
    'where is he working', 'what company', 'which company', 'which organization',
  )) {
    if (active.length) {
      return {
        rule: 'where-he-works',
        answer: `${first} is currently ${describeRoles(active)}.`,
      }
    }
    const jobs = workRoles(data.experience)
    if (jobs.length) {
      return {
        rule: 'where-he-works',
        answer: `Most recently, ${first} worked at ${jobs[0].orgFull} as a ${jobs[0].role}.`,
      }
    }
    return { rule: 'where-he-works', answer: `The portfolio doesn't include current workplace information.` }
  }

  // ── 9. Specific skill query ("does he know React?") ───────────────────────
  // Checked before the general work-experience rule so "experience with X"
  // returns a skill answer rather than the work history list.
  const skillHit = findSkill(q, data.skills)
  if (skillHit && has(q,
    'know', 'use', 'familiar', 'proficient', 'work with',
    'experience', 'does he', 'can he', 'has he', 'good at',
  )) {
    return {
      rule: 'skill-specific',
      answer: `Yes — ${skillHit.skill} is part of ${first}'s ${skillHit.category} skill set. Visit the Skills page to see the full stack.`,
    }
  }

  // ── 10. Availability / open to work ───────────────────────────────────────
  if (has(q, 'available', 'availability', 'open to work', 'looking for', 'hire him', 'hiring', 'opportunity', 'new grad', 'full-time', 'full time')) {
    const edu = data.experience.find(e => e.type === 'Education')
    const study = edu ? `a ${edu.role} student at ${edu.orgFull}` : 'a Computer Science co-op student'
    return {
      rule: 'availability',
      answer:
        `${first} is ${study} and is open to co-op and internship opportunities. ` +
        `Best way to reach him: ${data.profile.email} or LinkedIn.`,
    }
  }

  // ── 11. Work experience (general list) ────────────────────────────────────
  if (has(q, 'work history', 'work experience', 'jobs', 'employment', 'career', 'internship', 'intern', 'co-op', 'coop', 'previous role', 'experience')) {
    const jobs = workRoles(data.experience)
    return {
      rule: 'work-list',
      answer: [
        `${first}'s work experience:`,
        ...jobs.map(e => `• ${e.role} @ ${e.orgFull} (${e.type}, ${e.dates})`),
      ].join('\n'),
    }
  }

  // ── 12. Education ─────────────────────────────────────────────────────────
  if (has(q, 'school', 'university', 'college', 'degree', 'study', 'studied', 'studying', 'student', 'education', 'program', 'otu', 'ontario tech', 'undergrad', 'graduate', 'major', 'gpa', 'academic')) {
    const edu = data.experience.find(e => e.type === 'Education')
    if (edu) {
      return {
        rule: 'education',
        answer: `${first} is studying ${edu.role} at ${edu.orgFull} (${edu.dates}). ${edu.description}`.trim(),
      }
    }
    return {
      rule: 'education',
      answer: `${first} is a Computer Science student at Ontario Tech University in Oshawa, Ontario.`,
    }
  }

  // ── 13. Projects (general list) ───────────────────────────────────────────
  if (has(q, 'project', 'built', 'build', 'made', 'what has he', 'his work', 'apps', 'software', 'portfolio')) {
    const list = data.projects.map(p => `• ${p.title} — ${p.subtitle}`).join('\n')
    return {
      rule: 'projects-list',
      answer: `${first} has built:\n${list}\n\nAsk about any specific project for more details!`,
    }
  }

  // ── 14. Skills overview ───────────────────────────────────────────────────
  if (has(q,
    'skill', 'tech stack', 'technologies', 'what does he know', 'what can he do', 'what tech',
    'framework', 'tool', 'stack', 'proficient', 'good at',
    'frontend', 'backend', 'ai ', ' ml ', 'machine learning', 'devops', 'testing',
  )) {
    const summary = data.skills.map(c => `${c.icon} ${c.category}: ${c.skills.join(', ')}`).join('\n')
    return { rule: 'skills-overview', answer: `${first}'s tech stack:\n${summary}` }
  }

  // ── 15. Awards / achievements ─────────────────────────────────────────────
  if (has(q, 'award', 'achievement', 'win', 'won', "dean's list", 'deans list', 'hackathon', 'competition', 'honour', 'honor', 'prize', 'recognition')) {
    if (data.awards.length) {
      return {
        rule: 'awards',
        answer: [
          `${first}'s recognitions:`,
          ...data.awards.map(a => `• ${a.title} — ${a.org} (${a.year})`),
        ].join('\n'),
      }
    }
    return {
      rule: 'awards',
      answer: `The portfolio highlights academic excellence and competition wins — check the home page for details.`,
    }
  }

  // ── 16. Location ──────────────────────────────────────────────────────────
  // Checked after the work-specific "where does he work" rule (rule 8) so
  // "where does he work?" is never swallowed by this generic location handler.
  if (
    has(q, 'location', 'based', 'live', 'city', 'country', 'oshawa', 'toronto') ||
    (q.includes('where') && !q.includes('work'))
  ) {
    return { rule: 'location', answer: `${first} is based in ${data.profile.location}.` }
  }

  // ── 17. About / identity ──────────────────────────────────────────────────
  if (has(q, 'who is', 'who are', 'tell me about', 'about him', 'about you', 'introduce', 'bio', 'background', 'describe', 'summary')) {
    return { rule: 'about', answer: cleanBio(data.profile.bio) }
  }

  // ── 18. Unknown ───────────────────────────────────────────────────────────
  return {
    rule: 'unknown',
    answer:
      `That information isn't in ${first}'s portfolio. ` +
      `Try asking about his education, work experience, projects, skills, contact info, or awards.`,
  }
}

/** Convenience wrapper for callers that only need the text. */
export function ruleBasedAnswer(message: string, data: RagData): string {
  return resolveRule(message, data).answer
}

/**
 * Single source of truth for everything the assistant is allowed to know.
 *
 * Two products are exported:
 *
 *   buildCoreContext(now) — a compact always-included block: identity, contact,
 *     current roles, and a one-line index of every project, role and award.
 *     The index is what stops the model from answering "that isn't in the
 *     portfolio" about an entity it simply failed to retrieve.
 *
 *   chunks — retrievable detail, scored per query in retrieval.ts.
 *
 * Keeping the index in the core block means retrieval only has to be good
 * enough to find *depth*, never good enough to prove *existence*.
 */

import { awardsData } from '../../src/data/awardsData.js'
import { experienceData } from '../../src/data/experienceData.js'
import { profileData } from '../../src/data/profileData.js'
import { projectsData } from '../../src/data/projectsData.js'
import { skillsData } from '../../src/data/skillsData.js'

export type ChunkKind = 'experience' | 'education' | 'project' | 'skills' | 'award'

export interface CorpusChunk {
  id: string
  kind: ChunkKind
  title: string
  /** Extra query terms that should match this chunk but aren't in its text. */
  aliases: string[]
  text: string
}

/** Collapses the stray literal "/n" in the bio plus any doubled whitespace. */
function clean(raw: string): string {
  return raw.replace(/\s*\/n\s*/g, ' ').replace(/\s+/g, ' ').trim()
}

function isCurrent(dates: string): boolean {
  return /present|current/i.test(dates)
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

const experienceChunks: CorpusChunk[] = experienceData.map((exp) => ({
  id: `exp:${exp.id}`,
  kind: exp.type === 'Education' ? 'education' : 'experience',
  title: `${exp.role} — ${exp.orgFull}`,
  aliases: [exp.org, exp.orgFull, exp.role, exp.type, exp.location],
  text: [
    `Role: ${exp.role}`,
    `Organization: ${exp.orgFull}`,
    `Type: ${exp.type}`,
    `Dates: ${exp.dates}`,
    `Location: ${exp.location}`,
    exp.description ? `Summary: ${clean(exp.description)}` : '',
    exp.highlights.length ? `Highlights:\n${exp.highlights.map((h) => `- ${clean(h)}`).join('\n')}` : '',
    exp.tech.length ? `Technologies: ${exp.tech.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
}))

const projectChunks: CorpusChunk[] = projectsData.map((project) => ({
  id: `project:${project.id}`,
  kind: 'project',
  title: project.title,
  aliases: [project.title, project.subtitle, ...project.tags],
  text: [
    `Project: ${project.title}`,
    `Subtitle: ${project.subtitle}`,
    `Year: ${project.year}`,
    `Summary: ${clean(project.description)}`,
    `Detail: ${clean(project.longDescription)}`,
    `Tags: ${project.tags.join(', ')}`,
    project.githubUrl ? `GitHub: ${project.githubUrl}` : '',
    project.liveUrl ? `Live: ${project.liveUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
}))

const skillChunks: CorpusChunk[] = skillsData.map((category) => ({
  id: `skills:${category.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  kind: 'skills',
  title: `Skills — ${category.category}`,
  aliases: [category.category, ...category.skills],
  text: `${category.category} skills: ${category.skills.join(', ')}`,
}))

const awardChunks: CorpusChunk[] = awardsData.map((award) => ({
  id: `award:${award.id}`,
  kind: 'award',
  title: award.title,
  aliases: [award.title, award.org, 'award', 'achievement', 'recognition', 'honour', 'honor'],
  text: [
    `Award: ${award.title}`,
    `Organization: ${award.org}`,
    `Year: ${award.year}`,
    `Detail: ${clean(award.description)}`,
  ].join('\n'),
}))

export const chunks: CorpusChunk[] = [
  ...experienceChunks,
  ...projectChunks,
  ...skillChunks,
  ...awardChunks,
]

// ─── Core context ─────────────────────────────────────────────────────────────

const currentRoles = experienceData.filter((exp) => exp.type !== 'Education' && isCurrent(exp.dates))
const pastRoles = experienceData.filter((exp) => exp.type !== 'Education' && !isCurrent(exp.dates))
const education = experienceData.filter((exp) => exp.type === 'Education')

/** One line per entity, so the model always knows what exists even when the retriever misses. */
const entityIndex = [
  `Roles: ${experienceData.map((e) => `${e.role} @ ${e.orgFull} (${e.dates})`).join(' | ')}`,
  `Projects: ${projectsData.map((p) => `${p.title} (${p.year})`).join(' | ')}`,
  `Awards: ${awardsData.map((a) => `${a.title} (${a.year})`).join(' | ')}`,
  `Skill areas: ${skillsData.map((s) => s.category).join(', ')}`,
].join('\n')

export function buildCoreContext(now: Date): string {
  const today = now.toISOString().slice(0, 10)

  return [
    `Today's date is ${today}. Use it to reason about durations and what counts as current.`,
    '',
    '## Identity',
    `Name: ${profileData.name}`,
    `Headline: ${profileData.headline} (${profileData.tagline})`,
    `Location: ${profileData.location}`,
    `Bio: ${clean(profileData.bio)}`,
    '',
    '## Contact',
    `Email: ${profileData.email}`,
    `GitHub: ${profileData.github}`,
    `LinkedIn: ${profileData.linkedin}`,
    `Resume: ${profileData.resumeUrl} (also downloadable from the site's home page)`,
    '',
    '## Current status',
    currentRoles.length
      ? `Holds ${currentRoles.length} concurrent active ${currentRoles.length === 1 ? 'role' : 'roles'}: ${currentRoles
          .map((r) => `${r.role} at ${r.orgFull} (${r.type}, ${r.dates})`)
          .join('; ')}.`
      : 'No active role is listed.',
    education.length
      ? `Studying ${education[0].role} at ${education[0].orgFull} (${education[0].dates}).`
      : '',
    pastRoles.length
      ? `Previously: ${pastRoles.map((r) => `${r.role} at ${r.orgFull} (${r.dates})`).join('; ')}.`
      : '',
    '',
    '## Everything in the portfolio',
    entityIndex,
  ]
    .filter((line) => line !== '')
    .join('\n')
}


// ─── Entity mentions ──────────────────────────────────────────────────────────

/**
 * Proper nouns the visitor could name: projects, organisations, awards, skills.
 *
 * Category labels ("Languages", "AI / ML") are deliberately excluded — those are
 * the generic buckets a broad question uses ("what are his skills?"), and
 * treating them as entities would defeat the point of the check.
 */
const entityPhrases: string[] = (() => {
  const raw = [
    ...projectsData.map((p) => p.title),
    ...experienceData.flatMap((e) => [e.org, e.orgFull]),
    ...awardsData.flatMap((a) => [a.title, a.org]),
    ...skillsData.flatMap((c) => c.skills),
  ]

  // Titles are often "Name — Descriptor" ("Lee Language Lab — NLP Research"),
  // and visitors name only the first half. Index both sides as well as the
  // whole string. Only a spaced dash separates, so hyphenated words such as
  // "1D-CNN" and "Sit-to-stand" stay intact.
  const withParts = raw.flatMap((phrase) =>
    phrase.includes(' — ') || phrase.includes(' – ') || phrase.includes(' - ')
      ? [phrase, ...phrase.split(/\s[—–-]\s/)]
      : [phrase],
  )

  const normalized = withParts
    .map((phrase) => phrase.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
    // Very short fragments ("sql", "java") match too eagerly inside other words
    // once padded, and add little: a question naming only those is broad anyway.
    .filter((phrase) => phrase.length >= 4)

  return [...new Set(normalized)]
})()

/**
 * True when the question names something specific the portfolio knows about.
 *
 * Used to decide whether a directory-style answer ("here is every project")
 * actually answers what was asked. "What projects has he built?" names nothing
 * and the list is right; "What did he build at HackHive?" names an entity and
 * deserves a real answer about that entity.
 */
export function mentionsKnownEntity(question: string): boolean {
  const haystack = ` ${question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
  return entityPhrases.some((phrase) => haystack.includes(` ${phrase} `))
}

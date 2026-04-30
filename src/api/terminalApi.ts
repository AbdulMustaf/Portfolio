/**
 * terminalApi.ts
 *
 * API layer for the MiniTerminal component. In production, these call Vercel
 * serverless routes. Local fallbacks keep the terminal usable if the API is not
 * configured yet.
 *
 * Backend contract expected:
 *   GET  /api/viewer-count           → { viewerCount: number }
 *   POST /api/rag-chat               → { answer: string }
 *     body: { message: string, conversationHistory: ChatMessage[] }
 */

import { profileData } from '../data/profileData'
import { experienceData } from '../data/experienceData'
import { projectsData } from '../data/projectsData'
import { skillsData } from '../data/skillsData'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Viewer Count ─────────────────────────────────────────────────────────────

export async function getViewerCount(): Promise<number> {
  const sessionKey = '__portfolio_session_viewer_count'
  const sessionCount = sessionStorage.getItem(sessionKey)
  if (sessionCount) return parseInt(sessionCount, 10)

  try {
    const res = await fetch('/api/viewer-count')
    if (!res.ok) throw new Error('viewer-count failed')
    const data = await res.json() as { viewerCount?: number }
    if (typeof data.viewerCount !== 'number') throw new Error('viewer-count malformed')
    sessionStorage.setItem(sessionKey, String(data.viewerCount))
    return data.viewerCount
  } catch {
    await pause(250)
    const key = '__portfolio_visitor_count'
    const n = (parseInt(localStorage.getItem(key) ?? '0', 10)) + 1
    localStorage.setItem(key, String(n))
    sessionStorage.setItem(sessionKey, String(n))
    return n
  }
}

// ─── RAG Chat ─────────────────────────────────────────────────────────────────

export async function sendRagMessage(
  message: string,
  conversationHistory: ChatMessage[],
): Promise<string> {
  try {
    const res = await fetch('/api/rag-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory }),
    })
    if (!res.ok) throw new Error('rag-chat failed')
    const data = await res.json() as { answer?: string }
    if (!data.answer) throw new Error('rag-chat malformed')
    return data.answer
  } catch {
    await pause(450)
    return mockRagResponse(message, conversationHistory)
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function has(q: string, ...keywords: string[]): boolean {
  return keywords.some((k) => q.includes(k))
}

// ─── Local Fallback RAG ───────────────────────────────────────────────────────

function mockRagResponse(message: string, _history: ChatMessage[]): string {
  const q = message.toLowerCase()

  if (has(q, 'hello', 'hi', 'hey', 'sup', 'yo', 'greet')) {
    return `Hey! I'm a RAG assistant for Abdullah's portfolio. Ask me about his education, work experience, projects, skills, or how to get in touch.`
  }

  if (has(q, 'school', 'university', 'study', 'student', 'education', 'degree', 'ontario tech', 'otu', 'program', 'cs')) {
    return `Abdullah is a Computer Science co-op student at Ontario Tech University in Oshawa, Ontario, Canada.`
  }

  if (has(q, 'work', 'job', 'experience', 'co-op', 'coop', 'intern', 'employer', 'company', 'role', 'position', 'current', 'where does')) {
    const jobs = experienceData
      .map((e) => `• ${e.role} @ ${e.orgFull} (${e.dates})`)
      .join('\n')
    return `Abdullah's work experience:\n${jobs}`
  }

  if (has(q, 'project', 'built', 'build', 'made', 'created', 'app', 'software', 'portfolio')) {
    const list = projectsData.map((p) => `• ${p.title} — ${p.subtitle}`).join('\n')
    return `Abdullah has built:\n${list}\n\nSee the Projects page for full details!`
  }

  if (has(q, 'skill', 'tech', 'language', 'framework', 'stack', 'tool', 'know', 'use', 'good at', 'proficient')) {
    const summary = skillsData
      .map((c) => `${c.icon} ${c.category}: ${c.skills.slice(0, 4).join(', ')}`)
      .join('\n')
    return `Abdullah's tech stack:\n${summary}\n\nVisit the Skills page for the full breakdown.`
  }

  if (has(q, 'contact', 'email', 'reach', 'hire', 'linkedin', 'github', 'social', 'get in touch')) {
    return `You can reach Abdullah at:\n• Email: ${profileData.email}\n• LinkedIn: ${profileData.linkedin}\n• GitHub: ${profileData.github}`
  }

  if (has(q, 'award', 'achievement', 'win', 'won', 'recognition', 'dean', 'hackathon', 'competition', 'honour')) {
    return `Abdullah's recognition:\n• 🏆 1st Place — OPS Case Competition (Ontario Public Service, 2023)\n• 🥈 Hackathon Achievement (Ontario Tech, 2023)\n• ⭐ Dean's List (2022–2024)`
  }

  if (has(q, 'location', 'where', 'live', 'based', 'city', 'toronto', 'canada')) {
    return `Abdullah is based in ${profileData.location}.`
  }

  if (has(q, 'resume', 'cv', 'download', 'pdf')) {
    return `Abdullah's resume is available from the Resume button on the home page, or visit /resume directly.`
  }

  if (has(q, 'who', 'about', 'tell me', 'describe', 'introduce', 'yourself')) {
    return profileData.bio
  }

  return `I don't have a specific answer for that yet. Try asking about Abdullah's school, work experience, projects, skills, location, or how to contact him!`
}

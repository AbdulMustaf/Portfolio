/**
 * terminalApi.ts
 *
 * API layer for the MiniTerminal component.
 * Both functions are currently mocked. Each has a clearly-marked
 * "REPLACE" block showing exactly what to swap in once your backend exists.
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

/**
 * Returns how many times this portfolio has been visited.
 *
 * REPLACE with real API:
 *
 *   const res = await fetch('/api/viewer-count')
 *   if (!res.ok) throw new Error('viewer-count failed')
 *   const data = await res.json()     // { viewerCount: number }
 *   return data.viewerCount
 *
 * Mock: increments a per-browser localStorage counter starting at 41,
 * so the first visit shows "42nd viewer".
 */
export async function getViewerCount(): Promise<number> {
  await pause(350 + Math.random() * 200)
  const key = '__portfolio_visitor_count'
  const n = (parseInt(localStorage.getItem(key) ?? '41', 10)) + 1
  localStorage.setItem(key, String(n))
  return n
}

// ─── RAG Chat ─────────────────────────────────────────────────────────────────

/**
 * Sends a message + full conversation history to the RAG assistant.
 *
 * REPLACE with real API:
 *
 *   const res = await fetch('/api/rag-chat', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ message, conversationHistory }),
 *   })
 *   if (!res.ok) throw new Error('rag-chat failed')
 *   const data = await res.json()     // { answer: string }
 *   return data.answer
 *
 * The backend should:
 *   1. Retrieve relevant chunks from a vector store seeded with Abdullah's profile
 *   2. Pass retrieved context + conversationHistory + message to your LLM
 *   3. Return the model's answer as { answer: string }
 */
export async function sendRagMessage(
  message: string,
  conversationHistory: ChatMessage[],
): Promise<string> {
  await pause(800 + Math.random() * 700) // simulate LLM latency
  return mockRagResponse(message, conversationHistory)
}

// ─── Internals ────────────────────────────────────────────────────────────────

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function has(q: string, ...keywords: string[]): boolean {
  return keywords.some((k) => q.includes(k))
}

// ─── Mock RAG ─────────────────────────────────────────────────────────────────
// Delete everything below this line once the real backend is connected.

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

  return `I don't have a specific answer for that yet — the real RAG backend isn't connected. Try asking about Abdullah's school, work experience, projects, skills, location, or how to contact him!`
}

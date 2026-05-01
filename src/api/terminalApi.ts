/**
 * terminalApi.ts
 *
 * API layer for the MiniTerminal component.  In production these call the
 * Vercel serverless routes.  When those calls fail (no key, offline, etc.) the
 * frontend falls back to the shared rule-based engine in src/lib/ragRules.ts.
 *
 * Backend contract:
 *   GET  /api/viewer-count  → { viewerCount: number }
 *   POST /api/rag-chat      → { answer: string }
 *     body: { message: string, conversationHistory: ChatMessage[] }
 */

import { profileData } from '../data/profileData'
import { experienceData } from '../data/experienceData'
import { projectsData } from '../data/projectsData'
import { skillsData } from '../data/skillsData'
import { ruleBasedAnswer } from '../lib/ragRules'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Built once at module load; data files are static exports.
const ragData = {
  profile: profileData,
  experience: experienceData,
  projects: projectsData,
  skills: skillsData,
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
    return localFallback(message)
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function localFallback(message: string): string {
  return ruleBasedAnswer(message, ragData)
}

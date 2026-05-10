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

// Generate or retrieve a unique visitor ID. This ensures each browser instance
// is counted only once, even if the page is refreshed or the site is redeployed.
function getOrCreateVisitorId(): string {
  const key = '__portfolio_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    // Generate a unique ID using crypto.randomUUID() if available, otherwise fallback
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem(key, id)
  }
  return id
}

export async function getViewerCount(): Promise<number> {
  // Cache the result in sessionStorage to avoid multiple API calls in one session
  const sessionKey = '__portfolio_session_viewer_count'
  const cached = sessionStorage.getItem(sessionKey)
  if (cached) return parseInt(cached, 10)

  try {
    const visitorId = getOrCreateVisitorId()
    const res = await fetch(`/api/viewer-count?visitorId=${encodeURIComponent(visitorId)}`)
    if (!res.ok) throw new Error('viewer-count failed')
    const data = await res.json() as { viewerCount?: number }
    if (typeof data.viewerCount !== 'number') throw new Error('viewer-count malformed')
    sessionStorage.setItem(sessionKey, String(data.viewerCount))
    return data.viewerCount
  } catch (error) {
    console.warn('Failed to fetch viewer count from API:', error)
    await pause(250)
    // Fallback: use a simple localStorage counter (only used if API is unavailable)
    const key = '__portfolio_visitor_count_fallback'
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

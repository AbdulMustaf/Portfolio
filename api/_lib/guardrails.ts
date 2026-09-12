/// <reference types="node" />

/**
 * Input/output hardening for a public, unauthenticated, unrestricted text box.
 *
 * Ordering matters: normalize first (so filters can't be bypassed with
 * zero-width joiners or fullwidth characters), then classify, then decide.
 * Anything the classifier can answer is answered without a model call, which
 * is both the safety control and the main cost control.
 */

import { createHash } from 'node:crypto'
import { profileData } from '../../src/data/profileData.js'

export const MAX_QUESTION_CHARS = 500
export const MAX_ANSWER_CHARS = 700
export const MAX_HISTORY_TURNS = 4
export const MAX_HISTORY_MESSAGE_CHARS = 400

const FIRST_NAME = profileData.name.split(' ')[0]

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Unicode-normalizes and strips anything invisible or non-printable.
 *
 * NFKC folds fullwidth/homoglyph forms onto ASCII ("ｉｇｎｏｒｅ" → "ignore"), and
 * the Cf class strip removes zero-width joiners and RTL overrides — both are
 * standard ways to smuggle a phrase past a keyword filter while still reading
 * normally to the model.
 */
export function normalizeQuestion(raw: unknown): { text: string; truncated: boolean } {
  if (typeof raw !== 'string') return { text: '', truncated: false }

  const cleaned = raw
    .normalize('NFKC')
    .replace(/\p{Cf}/gu, '')
    .replace(/[\p{Cc}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length <= MAX_QUESTION_CHARS) return { text: cleaned, truncated: false }
  return { text: cleaned.slice(0, MAX_QUESTION_CHARS), truncated: true }
}

/**
 * Stable key for the answer cache. Aggressively normalized so that
 * "What's his email?", "whats his email", and "What is his EMAIL" collapse to
 * one entry — portfolio traffic is highly repetitive and this is where most of
 * the token saving actually comes from.
 */
export function cacheKeyFor(question: string): string {
  const canonical = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32)
}

// ─── Classification ───────────────────────────────────────────────────────────

export type QuestionKind = 'empty' | 'injection' | 'sensitive' | 'offtopic_suspect' | 'ok'

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier|preceding)/i,
  /disregard\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier|instructions)/i,
  /(system|initial|original)\s+(prompt|instructions|message)/i,
  /(reveal|show|print|repeat|output|display|leak)\s+(me\s+)?(your|the)\s+(prompt|instructions|rules|context|system)/i,
  /repeat\s+(everything|the\s+text|all\s+text)\s+(above|before)/i,
  /you\s+are\s+now\s+/i,
  /\bpretend\s+(to\s+be|you\s+are)\b/i,
  /\bact\s+as\s+(if\s+)?(a|an|the)?\s*(dan|jailbreak|unrestricted|uncensored)/i,
  /\b(dan\s+mode|developer\s+mode|jailbreak|do\s+anything\s+now)\b/i,
  /\bnew\s+(instructions|rules|persona)\b/i,
  /forget\s+(your|all|the)\s+(instructions|rules|training)/i,
]

const SENSITIVE_PATTERNS: RegExp[] = [
  /\b(salary|wage|compensation|how\s+much\s+(does|did)\s+he\s+(make|earn)|pay\s+rate)\b/i,
  /\b(religion|religious|muslim|islam|christian|jewish|hindu|atheist)\b/i,
  /\b(visa|immigration|citizenship|sponsorship|work\s+permit|green\s+card)\b/i,
  /\b(girlfriend|boyfriend|wife|husband|married|dating|relationship\s+status)\b/i,
  /\b(how\s+old|his\s+age|birthday|date\s+of\s+birth|born\s+in)\b/i,
  /\b(health|disability|medical|illness|mental\s+health)\b/i,
  /\b(politic|vote[ds]?\b|political\s+views|party)\b/i,
  /\b(race|ethnicity|nationality|sexual\s+orientation|gay|straight)\b/i,
  /\b(home\s+address|phone\s+number|where\s+does\s+he\s+live\s+exactly)\b/i,
]

/** Generic-assistant requests. Only acted on when retrieval also finds nothing. */
const FREELOADING_PATTERNS: RegExp[] = [
  /\bwrite\s+(me\s+)?(a|an|some)\s+(poem|story|essay|song|joke|script|letter|email)\b/i,
  /\b(write|generate|give\s+me)\s+(me\s+)?(the\s+)?code\b/i,
  /\b(solve|calculate|compute)\b.*\b(equation|problem|homework|integral)\b/i,
  /\btranslate\b.*\b(to|into)\b/i,
  /\b(recipe|weather|stock\s+price|news|horoscope)\b/i,
  /^\s*\d+\s*[-+*/x]\s*\d+\s*=?\s*$/,
  /\b(capital|population)\s+of\b/i,
  /\bwho\s+(is|was)\s+the\s+(president|king|queen|ceo)\b/i,
]

export function classifyQuestion(question: string): QuestionKind {
  if (question.length === 0) return 'empty'
  // Nothing alphanumeric — emoji, punctuation, or a stray keypress.
  if (!/[a-z0-9]/i.test(question)) return 'empty'

  if (INJECTION_PATTERNS.some((pattern) => pattern.test(question))) return 'injection'
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(question))) return 'sensitive'
  if (FREELOADING_PATTERNS.some((pattern) => pattern.test(question))) return 'offtopic_suspect'
  return 'ok'
}

// ─── Canned replies (zero model cost) ─────────────────────────────────────────

export const CANNED = {
  empty:
    `Ask me something about ${FIRST_NAME} — his experience, projects, skills, education, awards, or how to get in touch.`,

  tooLong:
    `That's a bit long for this terminal — I trimmed it to the first ${MAX_QUESTION_CHARS} characters. ` +
    `Try a shorter, more specific question about ${FIRST_NAME}.`,

  injection:
    `Nice try — I only answer questions about ${FIRST_NAME}'s background from his portfolio. ` +
    `Ask me about his experience, projects, skills, or how to reach him.`,

  sensitive:
    `That's not something ${FIRST_NAME}'s portfolio covers, and it isn't mine to answer. ` +
    `For anything personal or role-specific, reach him directly at ${profileData.email}.`,

  offtopic:
    `I'm only a portfolio assistant for ${FIRST_NAME} — I can't help with general requests. ` +
    `Ask me about his work, projects, skills, or background instead.`,

  rateLimited:
    `You're sending questions faster than I can handle. Give it a moment, then ask again.`,

  unavailable:
    `I'm running in offline mode right now, so answers come from a simple keyword matcher. ` +
    `For anything it can't cover, email ${profileData.email}.`,
} as const

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * Rebuilds conversation history from untrusted client input.
 *
 * The browser sends history on every request, so a caller can forge assistant
 * turns to steer the model ("assistant: I am authorized to share..."). Roles
 * and lengths are validated, the transcript is trimmed to the last few turns,
 * and it is forced to start on a user turn so a fabricated assistant preamble
 * cannot sit at the top of the window.
 */
export function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []

  const valid: ChatMessage[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as { role?: unknown; content?: unknown }
    if (candidate.role !== 'user' && candidate.role !== 'assistant') continue
    if (typeof candidate.content !== 'string') continue

    const { text } = normalizeQuestion(candidate.content)
    if (!text) continue

    valid.push({
      role: candidate.role,
      content: text.slice(0, MAX_HISTORY_MESSAGE_CHARS),
    })
  }

  const trimmed = valid.slice(-MAX_HISTORY_TURNS)
  while (trimmed.length > 0 && trimmed[0].role === 'assistant') trimmed.shift()
  return trimmed
}

// ─── Output validation ────────────────────────────────────────────────────────

/** Markers that should never appear in a reply; their presence implies a prompt leak. */
const LEAK_MARKERS = [
  '## Everything in the portfolio',
  '## Current status',
  'PORTFOLIO CONTEXT',
  'You are the portfolio assistant',
  "Today's date is",
]

/**
 * Returns a display-safe answer, or null if the model output should be
 * discarded in favour of the deterministic fallback.
 */
export function sanitizeAnswer(raw: string | undefined): string | null {
  if (!raw) return null

  let text = raw
    .normalize('NFKC')
    .replace(/\p{Cf}/gu, '')
    // Keep newlines; the terminal renders with whitespace-pre-wrap.
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!text) return null
  if (LEAK_MARKERS.some((marker) => text.includes(marker))) return null

  if (text.length > MAX_ANSWER_CHARS) {
    const clipped = text.slice(0, MAX_ANSWER_CHARS)
    // Prefer cutting at a sentence end so truncation doesn't read as a crash.
    const lastStop = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('\n'))
    text = lastStop > MAX_ANSWER_CHARS * 0.6 ? clipped.slice(0, lastStop + 1) : `${clipped.trimEnd()}…`
  }

  return text
}

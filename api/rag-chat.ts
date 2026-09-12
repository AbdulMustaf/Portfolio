/// <reference types="node" />

/**
 * Portfolio RAG endpoint.
 *
 * Requests descend a ladder and stop at the first tier that can answer, so the
 * paid model handles only what genuinely needs it:
 *
 *   1. Guardrails      empty / injection / sensitive / off-topic   0 tokens
 *   2. Rule engine     intents that are pure data lookups          0 tokens
 *   3. Answer cache    a repeat of an earlier question             0 tokens
 *   4. Gemini          open-ended questions, grounded + budgeted   ~$0.0006
 *   5. Rule engine     rate-limited, over budget, or model down    0 tokens
 *
 * Tier 5 means the site never hard-fails, but the response always reports the
 * tier that served it (body `mode` + `X-RAG-Mode`) so a dead model surfaces
 * instead of quietly degrading into keyword matching — which is exactly how a
 * shut-down model ID went unnoticed here for months.
 */

import { createHash } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { awardsData } from '../src/data/awardsData.js'
import { experienceData } from '../src/data/experienceData.js'
import { profileData } from '../src/data/profileData.js'
import { projectsData } from '../src/data/projectsData.js'
import { skillsData } from '../src/data/skillsData.js'
import { resolveRule } from '../src/lib/ragRules.js'
import type { RuleId } from '../src/lib/ragRules.js'

import { recordUsage, reserve } from './_lib/budget.js'
import { buildCoreContext, mentionsKnownEntity } from './_lib/corpus.js'
import { callModel, modelName } from './_lib/gemini.js'
import {
  CANNED,
  cacheKeyFor,
  classifyQuestion,
  normalizeQuestion,
  sanitizeAnswer,
  sanitizeHistory,
} from './_lib/guardrails.js'
import { kvGet, kvSetEx } from './_lib/kv.js'
import { formatChunks, retrieve } from './_lib/retrieval.js'

const MAX_BODY_BYTES = 8_000
const CACHE_TTL_SECONDS = 7 * 86_400

const ragData = {
  profile: profileData,
  experience: experienceData,
  projects: projectsData,
  skills: skillsData,
  awards: awardsData,
}

/**
 * Intents whose rule output is curated text or an exhaustive list — a model
 * rewrite would cost money and could only make them less accurate.
 *
 * Only while the question names nothing specific, though. These answers are
 * directories ("here is every project"), which answer "what has he built?" well
 * and "what did he build at HackHive?" badly. See the entity check below.
 */
const RULE_IS_BEST: ReadonlySet<RuleId> = new Set<RuleId>([
  'greeting', 'resume', 'contact', 'location',
  'awards', 'work-list', 'projects-list', 'skills-overview', 'education', 'about',
])

type Mode =
  | 'guard-empty' | 'guard-injection' | 'guard-sensitive' | 'guard-offtopic'
  | 'rule' | 'rule-conserve' | 'cache' | 'model'
  | 'fallback-rate-limited' | 'fallback-budget' | 'fallback-unavailable' | 'fallback-model-error'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    let bytes = 0
    req.on('data', (chunk: Buffer | string) => {
      bytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      body += chunk
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * Stable pseudonymous id for rate limiting.
 * The raw IP is hashed so buckets can't be reversed into a visitor log.
 */
function getClientId(req: IncomingMessage): string {
  const forwardedFor = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']

  let source = 'unknown'
  if (typeof forwardedFor === 'string' && forwardedFor) source = forwardedFor.split(',')[0].trim()
  else if (typeof realIp === 'string' && realIp) source = realIp
  else if (req.socket.remoteAddress) source = req.socket.remoteAddress

  return createHash('sha256').update(source).digest('hex').slice(0, 20)
}

function send(res: ServerResponse, status: number, payload: object, mode: Mode, retryAfter = 0) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-RAG-Mode', mode)
  if (retryAfter > 0) res.setHeader('Retry-After', String(Math.max(1, Math.round(retryAfter))))
  res.end(JSON.stringify({ ...payload, mode }))
}

/** Modes where answers come from the keyword engine rather than the model. */
const DEGRADED: ReadonlySet<Mode> = new Set<Mode>([
  'fallback-rate-limited', 'fallback-budget', 'fallback-unavailable', 'fallback-model-error',
])

function reply(res: ServerResponse, answer: string, mode: Mode, retryAfter = 0) {
  send(res, 200, { answer, degraded: DEGRADED.has(mode) }, mode, retryAfter)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const now = new Date()

  let body: { message?: unknown; conversationHistory?: unknown }
  try {
    body = JSON.parse(await readBody(req)) as typeof body
  } catch {
    // Oversized or malformed payloads are the request's fault, not the model's.
    send(res, 400, { error: 'Invalid request body' }, 'guard-empty')
    return
  }

  // ── Tier 1: guardrails ─────────────────────────────────────────────────────
  const { text: question, truncated } = normalizeQuestion(body.message)
  const kind = classifyQuestion(question)

  if (kind === 'empty') {
    reply(res, CANNED.empty, 'guard-empty')
    return
  }
  if (kind === 'injection') {
    reply(res, CANNED.injection, 'guard-injection')
    return
  }
  if (kind === 'sensitive') {
    reply(res, CANNED.sensitive, 'guard-sensitive')
    return
  }

  const history = sanitizeHistory(body.conversationHistory)
  const retrieval = retrieve(question, 3)

  // A generic-assistant request that also shares no vocabulary with the corpus.
  // Both signals are required: "write a summary of his research" looks like a
  // freeloading pattern but retrieves strongly, and deserves a real answer.
  if (kind === 'offtopic_suspect' && retrieval.topScore === 0) {
    reply(res, CANNED.offtopic, 'guard-offtopic')
    return
  }

  // ── Tier 2: deterministic rules ────────────────────────────────────────────
  const ruled = resolveRule(question, ragData)

  // A directory-style answer is only the best answer to a question that named
  // nothing specific. Once a visitor names a project, employer, award or
  // skill, handing back the full list ignores what they asked, so those
  // questions fall through to the model — which is what the budget is for.
  if (RULE_IS_BEST.has(ruled.rule) && !mentionsKnownEntity(question)) {
    reply(res, ruled.answer, 'rule')
    return
  }

  // A truncated question is a fragment; answer from rules rather than paying to
  // reason about half a sentence.
  if (truncated) {
    reply(res, `${CANNED.tooLong}\n\n${ruled.answer}`, 'rule')
    return
  }

  // ── Budget gate ────────────────────────────────────────────────────────────
  const decision = await reserve(getClientId(req), now)

  if (!decision.allowModel) {
    const mode: Mode =
      decision.reason === 'rate-limited' ? 'fallback-rate-limited'
      : decision.reason === 'kv-unavailable' ? 'fallback-unavailable'
      : 'fallback-budget'

    // Rate-limited visitors with no rule match get told why; everyone else
    // still gets the best deterministic answer available.
    const answer = mode === 'fallback-rate-limited' && ruled.rule === 'unknown'
      ? CANNED.rateLimited
      : ruled.answer
    reply(res, answer, mode, decision.retryAfterSeconds)
    return
  }

  // Past 80% of the monthly budget, any rule match is good enough — the model
  // is reserved for questions nothing else can answer.
  if (decision.conserve && ruled.rule !== 'unknown') {
    reply(res, ruled.answer, 'rule-conserve')
    return
  }

  // ── Tier 3: answer cache ───────────────────────────────────────────────────
  // Only for the first question of a conversation: with history in play the
  // same words can legitimately mean different things across sessions.
  const cacheable = history.length === 0
  const cacheKey = `rag:ans:${modelName()}:${cacheKeyFor(question)}`

  if (cacheable) {
    const cached = await kvGet(cacheKey)
    if (cached) {
      reply(res, cached, 'cache')
      return
    }
  }

  // ── Tier 4: model ──────────────────────────────────────────────────────────
  const context = [
    buildCoreContext(now),
    formatChunks(retrieval.chunks),
  ].filter(Boolean).join('\n\n## Relevant detail\n\n')

  const result = await callModel(question, context, history)

  if (result.usage.promptTokens > 0 || result.usage.outputTokens > 0) {
    // Charge the ledger even for a failed call — tokens that were billed must
    // be counted, or the budget silently overruns on a bad day.
    await recordUsage(now, result.usage.promptTokens, result.usage.outputTokens)
  }

  const answer = sanitizeAnswer(result.text ?? undefined)

  if (!answer) {
    console.error('[rag-chat] model unavailable', {
      model: modelName(),
      failure: result.failure ?? 'sanitizer-rejected',
    })
    reply(res, ruled.answer, 'fallback-model-error')
    return
  }

  if (cacheable) {
    await kvSetEx(cacheKey, answer, CACHE_TTL_SECONDS)
  }

  reply(res, answer, 'model')
}

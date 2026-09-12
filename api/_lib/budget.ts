/// <reference types="node" />

/**
 * Abuse and spend control.
 *
 * Two independent ceilings, because the binding constraint differs by tier:
 *   - Free tier: requests/day is what runs out (Flash-Lite allows ~1k RPD).
 *   - Paid tier: dollars run out first.
 * Both are enforced so switching tiers is an env change, not a code change.
 *
 * Money is tracked in integer micro-dollars (1 USD = 1e6) so the ledger can
 * live in a Redis counter without float drift.
 *
 * Fail-closed by design: if KV is unreachable we cannot count, so the model is
 * not called at all and the deterministic engine answers instead. For a fixed
 * monthly budget, silently losing the meter is strictly worse than losing the
 * nicer phrasing.
 */

import { kvAvailable, kvGetCounters, kvIncrBy, kvIncrCounters } from './kv.js'

const MICRO = 1_000_000

/** Per-visitor request ceilings. These bound abuse, not normal reading. */
const LIMITS = {
  perMinute: 5,
  perHour: 20,
  perDay: 40,
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function monthlyBudgetMicros(): number {
  return Math.round(envNumber('RAG_MONTHLY_BUDGET_USD', 2) * MICRO)
}

/**
 * A single day may spend at most 1/15th of the month.
 * Without this, one scripted afternoon burns the entire budget and the
 * assistant is dead for the remaining three weeks.
 */
function dailyBudgetMicros(): number {
  return Math.max(1, Math.round(monthlyBudgetMicros() / 15))
}

function maxCallsPerDay(): number {
  return Math.round(envNumber('RAG_MAX_MODEL_CALLS_PER_DAY', 800))
}

export function pricesPerMillion(): { input: number; output: number } {
  return {
    input: envNumber('RAG_PRICE_INPUT_PER_M', 0.25),
    output: envNumber('RAG_PRICE_OUTPUT_PER_M', 1.5),
  }
}

export function estimateCostMicros(promptTokens: number, outputTokens: number): number {
  const prices = pricesPerMillion()
  const usd = (promptTokens * prices.input + outputTokens * prices.output) / 1_000_000
  return Math.round(usd * MICRO)
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10)
}

function monthKey(now: Date): string {
  return now.toISOString().slice(0, 7)
}

const spendDayKey = (now: Date) => `rag:spend:d:${dayKey(now)}`
const spendMonthKey = (now: Date) => `rag:spend:m:${monthKey(now)}`
const callsDayKey = (now: Date) => `rag:calls:d:${dayKey(now)}`

// ─── Decision ─────────────────────────────────────────────────────────────────

export type DenyReason =
  | 'kv-unavailable'
  | 'rate-limited'
  | 'daily-calls-exhausted'
  | 'daily-budget-exhausted'
  | 'monthly-budget-exhausted'

export interface BudgetDecision {
  /** True when the model may be called. */
  allowModel: boolean
  reason: DenyReason | null
  /** Seconds until the visitor's tightest bucket resets; only set for rate limits. */
  retryAfterSeconds: number
  /** True once >=80% of the monthly budget is gone — callers widen the free tiers. */
  conserve: boolean
  spentMicros: number
  budgetMicros: number
}

/**
 * Increments this visitor's rate-limit buckets and reads the spend ledger in a
 * single round trip, then decides whether a model call is permitted.
 */
export async function reserve(clientId: string, now: Date): Promise<BudgetDecision> {
  const budgetMicros = monthlyBudgetMicros()

  if (!kvAvailable()) {
    return {
      allowModel: false,
      reason: 'kv-unavailable',
      retryAfterSeconds: 0,
      conserve: true,
      spentMicros: 0,
      budgetMicros,
    }
  }

  const minuteBucket = Math.floor(now.getTime() / 60_000)
  const hourBucket = Math.floor(now.getTime() / 3_600_000)

  const counted = await kvIncrCounters([
    { key: `rag:rl:${clientId}:m:${minuteBucket}`, ttlSeconds: 120 },
    { key: `rag:rl:${clientId}:h:${hourBucket}`, ttlSeconds: 7_200 },
    { key: `rag:rl:${clientId}:d:${dayKey(now)}`, ttlSeconds: 172_800 },
  ])

  const ledger = await kvGetCounters([
    spendMonthKey(now),
    spendDayKey(now),
    callsDayKey(now),
  ])

  if (!counted || !ledger) {
    return {
      allowModel: false,
      reason: 'kv-unavailable',
      retryAfterSeconds: 0,
      conserve: true,
      spentMicros: 0,
      budgetMicros,
    }
  }

  const [perMinute, perHour, perDay] = counted
  const [monthSpend, daySpend, dayCalls] = ledger
  const conserve = monthSpend >= budgetMicros * 0.8

  const base: Omit<BudgetDecision, 'allowModel' | 'reason' | 'retryAfterSeconds'> = {
    conserve,
    spentMicros: monthSpend,
    budgetMicros,
  }

  if (perMinute > LIMITS.perMinute) {
    return { ...base, allowModel: false, reason: 'rate-limited', retryAfterSeconds: 60 - (now.getSeconds()) }
  }
  if (perHour > LIMITS.perHour) {
    return { ...base, allowModel: false, reason: 'rate-limited', retryAfterSeconds: 300 }
  }
  if (perDay > LIMITS.perDay) {
    return { ...base, allowModel: false, reason: 'rate-limited', retryAfterSeconds: 3_600 }
  }
  if (dayCalls >= maxCallsPerDay()) {
    return { ...base, allowModel: false, reason: 'daily-calls-exhausted', retryAfterSeconds: 0 }
  }
  if (daySpend >= dailyBudgetMicros()) {
    return { ...base, allowModel: false, reason: 'daily-budget-exhausted', retryAfterSeconds: 0 }
  }
  if (monthSpend >= budgetMicros) {
    return { ...base, allowModel: false, reason: 'monthly-budget-exhausted', retryAfterSeconds: 0 }
  }

  return { ...base, allowModel: true, reason: null, retryAfterSeconds: 0 }
}

/**
 * Records what a completed model call actually cost.
 *
 * Token counts come from the provider's usageMetadata rather than an estimate,
 * so the ledger reflects real billing (including any cached-token discount).
 */
export async function recordUsage(
  now: Date,
  promptTokens: number,
  outputTokens: number,
): Promise<void> {
  if (!kvAvailable()) return
  const micros = estimateCostMicros(promptTokens, outputTokens)

  await Promise.all([
    kvIncrBy(spendMonthKey(now), micros, 40 * 86_400),
    kvIncrBy(spendDayKey(now), micros, 3 * 86_400),
    kvIncrBy(callsDayKey(now), 1, 3 * 86_400),
  ])
}

/** Read-only ledger snapshot for the health endpoint. */
export async function readLedger(now: Date): Promise<{
  monthSpendMicros: number
  daySpendMicros: number
  dayCalls: number
  budgetMicros: number
} | null> {
  if (!kvAvailable()) return null
  const ledger = await kvGetCounters([spendMonthKey(now), spendDayKey(now), callsDayKey(now)])
  if (!ledger) return null
  return {
    monthSpendMicros: ledger[0],
    daySpendMicros: ledger[1],
    dayCalls: ledger[2],
    budgetMicros: monthlyBudgetMicros(),
  }
}

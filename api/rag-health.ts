/// <reference types="node" />

/**
 * Private health check for the RAG stack.
 *
 * Exists because the previous failure mode was invisible: a shut-down model ID
 * returned 404 on every request and the endpoint answered from keyword search
 * anyway, so the site looked fine for months. `?probe=1` actually calls the
 * model (a few tokens) to prove the path works end to end.
 *
 * Requires RAG_HEALTH_TOKEN; without a match it 404s rather than 401s, so the
 * route's existence isn't advertised to scanners.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

import { readLedger } from './_lib/budget.js'
import { callModel, modelName } from './_lib/gemini.js'
import { kvAvailable } from './_lib/kv.js'

function notFound(res: ServerResponse) {
  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: 'Not found' }))
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const expected = process.env.RAG_HEALTH_TOKEN
  const url = new URL(req.url ?? '/', 'http://localhost')
  const provided = url.searchParams.get('token')

  if (!expected || provided !== expected) {
    notFound(res)
    return
  }

  const now = new Date()
  const ledger = await readLedger(now)

  let probe: { ok: boolean; detail: string } | null = null
  if (url.searchParams.get('probe') === '1') {
    const result = await callModel('Reply with the single word OK.', 'No context needed.', [])
    probe = {
      ok: result.text !== null,
      detail: result.failure ?? `ok (${result.usage.promptTokens}+${result.usage.outputTokens} tokens)`,
    }
  }

  const usd = (micros: number) => Number((micros / 1_000_000).toFixed(4))

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify({
    model: modelName(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    kvAvailable: kvAvailable(),
    probe,
    budget: ledger
      ? {
          monthSpendUsd: usd(ledger.monthSpendMicros),
          daySpendUsd: usd(ledger.daySpendMicros),
          budgetUsd: usd(ledger.budgetMicros),
          percentUsed: Math.round((ledger.monthSpendMicros / Math.max(1, ledger.budgetMicros)) * 100),
          modelCallsToday: ledger.dayCalls,
        }
      : null,
  }, null, 2))
}

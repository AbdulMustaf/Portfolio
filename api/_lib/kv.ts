/// <reference types="node" />

/**
 * Minimal Upstash / Vercel KV REST client.
 *
 * Uses the single-command POST form (`POST {url}` with a JSON array body) and
 * the `/pipeline` endpoint for batched commands, so values containing slashes,
 * spaces or unicode never need URL escaping.
 *
 * Every helper degrades to `null` instead of throwing: KV is a cost/abuse
 * control, not a correctness dependency. If it is unreachable the caller
 * decides whether to fail open (serve an answer) or closed (refuse).
 */

const REQUEST_TIMEOUT_MS = 1_500

/**
 * Resolves REST credentials under either naming scheme.
 *
 * The legacy Vercel KV integration sets KV_REST_API_*; the Upstash Marketplace
 * integration that replaced it sets UPSTASH_REDIS_REST_*. Accepting both means
 * provisioning is a one-click install with no manual env aliasing.
 */
export function kvCredentials(): { url?: string; token?: string } {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  return { url: url?.replace(/\/+$/, ''), token }
}

function credentials(): { url: string; token: string } | null {
  const { url, token } = kvCredentials()
  if (!url || !token) return null
  return { url, token }
}

export function kvAvailable(): boolean {
  return credentials() !== null
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const creds = credentials()
  if (!creds) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${creds.url}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // Timeout, DNS failure, malformed JSON — all non-fatal.
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Runs one Redis command. Returns the raw `result` value, or null on failure. */
async function command<T>(args: (string | number)[]): Promise<T | null> {
  const data = await post<{ result?: T }>('', args)
  return data && data.result !== undefined ? data.result : null
}

/** Runs several commands in a single round trip. Returns results positionally. */
async function pipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const data = await post<Array<{ result?: unknown }>>('/pipeline', commands)
  if (!Array.isArray(data)) return null
  return data.map((entry) => (entry && 'result' in entry ? entry.result : null))
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function kvGet(key: string): Promise<string | null> {
  const result = await command<string | null>(['GET', key])
  return typeof result === 'string' ? result : null
}

export async function kvSetEx(key: string, value: string, ttlSeconds: number): Promise<void> {
  await command(['SET', key, value, 'EX', Math.max(1, Math.floor(ttlSeconds))])
}

/**
 * Increments `key` by `amount` and guarantees a TTL is set.
 *
 * EXPIRE uses the NX flag so a bucket's lifetime is fixed at first write and
 * later increments cannot slide the window forward — without NX a steady
 * stream of requests would keep a rate-limit bucket alive indefinitely.
 */
export async function kvIncrBy(
  key: string,
  amount: number,
  ttlSeconds: number,
): Promise<number | null> {
  const results = await pipeline([
    ['INCRBY', key, Math.round(amount)],
    ['EXPIRE', key, Math.max(1, Math.floor(ttlSeconds)), 'NX'],
  ])
  if (!results) return null
  return toNumber(results[0])
}

/**
 * Reads several counters in one round trip.
 * Missing keys come back as 0 so callers can treat the result as a plain tally.
 */
export async function kvGetCounters(keys: string[]): Promise<number[] | null> {
  if (keys.length === 0) return []
  const results = await pipeline(keys.map((key) => ['GET', key]))
  if (!results) return null
  return results.map((value) => toNumber(value) ?? 0)
}

/**
 * Increments several counters in one round trip, each with its own TTL.
 * Returns the post-increment values positionally.
 */
export async function kvIncrCounters(
  entries: Array<{ key: string; ttlSeconds: number }>,
): Promise<number[] | null> {
  if (entries.length === 0) return []
  const commands: (string | number)[][] = []
  for (const entry of entries) {
    commands.push(['INCR', entry.key])
    commands.push(['EXPIRE', entry.key, Math.max(1, Math.floor(entry.ttlSeconds)), 'NX'])
  }
  const results = await pipeline(commands)
  if (!results) return null
  return entries.map((_, index) => toNumber(results[index * 2]) ?? 0)
}

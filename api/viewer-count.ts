/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from 'node:http'

const VIEWER_COUNT_KEY = 'portfolio:viewer-count'
const VISITOR_SET_KEY = 'portfolio:visitors'

// Extract query parameter from URL
function getQueryParam(url: string, param: string): string | null {
  try {
    const u = new URL(url, 'http://localhost')
    return u.searchParams.get(param)
  } catch {
    return null
  }
}

// Check if visitor ID has been seen before (uses KV with hash-based tracking)
async function isNewVisitor(visitorId: string): Promise<boolean> {
  if (!visitorId) return true // Treat missing ID as new (shouldn't happen)

  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return true // If KV unavailable, treat as new (fallback)

  // Check if visitor exists in the set: SISMEMBER portfolio:visitors <visitorId>
  try {
    const res = await fetch(`${url}/sismember/${encodeURIComponent(VISITOR_SET_KEY)}/${encodeURIComponent(visitorId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return true // If check fails, assume new
    const data = await res.json() as { result?: number }
    return data.result === 0 // 0 = not a member, so it's new
  } catch {
    return true // On error, treat as new
  }
}

// Add visitor ID to the set and increment count
async function registerNewVisitor(visitorId: string): Promise<number | null> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null

  try {
    // Add to set: SADD portfolio:visitors <visitorId>
    await fetch(`${url}/sadd/${encodeURIComponent(VISITOR_SET_KEY)}/${encodeURIComponent(visitorId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Increment count: INCR portfolio:viewer-count
    const res = await fetch(`${url}/incr/${encodeURIComponent(VIEWER_COUNT_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`KV increment failed: ${res.status}`)

    const data = await res.json() as { result?: number }
    return typeof data.result === 'number' ? data.result : null
  } catch (error) {
    console.error('KV operation failed:', error)
    return null
  }
}

// Get current viewer count without incrementing
async function getViewerCount(): Promise<number | null> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(VIEWER_COUNT_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json() as { result?: string | number | null }
    const result = data.result
    return typeof result === 'number' ? result : (typeof result === 'string' ? parseInt(result, 10) : null)
  } catch {
    return null
  }
}

let localViewerCount = 0
const localVisitors = new Set<string>()

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Extract visitor ID from query string
  const visitorId = getQueryParam(req.url || '', 'visitorId')
  if (!visitorId) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'visitorId query parameter required' }))
    return
  }

  try {
    // Check if this is a new visitor
    const isNew = await isNewVisitor(visitorId)

    let viewerCount: number | null = null

    if (isNew) {
      // Register this visitor and increment count
      viewerCount = await registerNewVisitor(visitorId)
    }

    // If we don't have a count yet, fetch it
    if (viewerCount === null) {
      viewerCount = await getViewerCount()
    }

    // Fallback to in-memory counter if KV is unavailable
    if (viewerCount === null) {
      if (!localVisitors.has(visitorId)) {
        localVisitors.add(visitorId)
        localViewerCount++
      }
      viewerCount = localViewerCount
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ viewerCount, isNewVisitor: isNew }))
  } catch (error) {
    console.error('viewer-count error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from 'node:http'

const key = 'portfolio:viewer-count'

async function incrementWithKv(): Promise<number | null> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null

  const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`KV increment failed: ${res.status}`)

  const data = await res.json() as { result?: number }
  return typeof data.result === 'number' ? data.result : null
}

let localViewerCount = 0

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  if (_req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  let kvCount: number | null = null
  try {
    kvCount = await incrementWithKv()
  } catch (error) {
    console.error('KV increment failed, falling back to in-memory counter:', error)
  }

  const viewerCount = kvCount ?? ++localViewerCount

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify({ viewerCount }))
}

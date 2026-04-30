import type { IncomingMessage, ServerResponse } from 'node:http'
import { experienceData } from '../src/data/experienceData'
import { profileData } from '../src/data/profileData'
import { projectsData } from '../src/data/projectsData'
import { skillsData } from '../src/data/skillsData'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RagRequest {
  message?: string
  conversationHistory?: ChatMessage[]
}

interface CorpusChunk {
  title: string
  text: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

const rateLimitWindowMs = 60_000
const maxGeminiRequestsPerWindow = 6
const maxGeminiRequestsPerDay = 60

const minuteBuckets = new Map<string, { count: number; resetAt: number }>()
const dayBuckets = new Map<string, { count: number; resetAt: number }>()

const corpus: CorpusChunk[] = [
  {
    title: 'Profile',
    text: [
      `Name: ${profileData.name}`,
      `Headline: ${profileData.headline}`,
      `Tagline: ${profileData.tagline}`,
      `Location: ${profileData.location}`,
      `Email: ${profileData.email}`,
      `GitHub: ${profileData.github}`,
      `LinkedIn: ${profileData.linkedin}`,
      `Bio: ${profileData.bio}`,
    ].join('\n'),
  },
  ...experienceData.map((experience) => ({
    title: `Experience: ${experience.role} at ${experience.orgFull}`,
    text: [
      `Role: ${experience.role}`,
      `Organization: ${experience.orgFull}`,
      `Type: ${experience.type}`,
      `Dates: ${experience.dates}`,
      `Location: ${experience.location}`,
      `Description: ${experience.description}`,
      `Highlights: ${experience.highlights.join(' ')}`,
      `Technologies: ${experience.tech.join(', ')}`,
    ].join('\n'),
  })),
  ...projectsData.map((project) => ({
    title: `Project: ${project.title}`,
    text: [
      `Title: ${project.title}`,
      `Subtitle: ${project.subtitle}`,
      `Year: ${project.year}`,
      `Description: ${project.description}`,
      `Details: ${project.longDescription}`,
      `Tags: ${project.tags.join(', ')}`,
      project.githubUrl ? `GitHub: ${project.githubUrl}` : '',
      project.liveUrl ? `Live URL: ${project.liveUrl}` : '',
    ].filter(Boolean).join('\n'),
  })),
  ...skillsData.map((category) => ({
    title: `Skills: ${category.category}`,
    text: `${category.category}: ${category.skills.join(', ')}`,
  })),
]

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 12_000) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+\-/.\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

function retrieveContext(message: string) {
  const terms = tokenize(message)
  const scored = corpus.map((chunk) => {
    const haystack = `${chunk.title}\n${chunk.text}`.toLowerCase()
    const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0)
    return { ...chunk, score }
  })

  const matches = scored
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return (matches.length ? matches : corpus.slice(0, 4))
    .map((chunk) => `## ${chunk.title}\n${chunk.text}`)
    .join('\n\n')
}

function fallbackAnswer(message: string, context: string) {
  return [
    'I can still answer from Abdullah\'s portfolio data, but the AI layer is unavailable or rate-limited right now.',
    '',
    `Relevant context I found for "${message}":`,
    context,
  ].join('\n')
}

function getClientId(req: IncomingMessage) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp) return realIp

  return req.socket.remoteAddress ?? 'unknown'
}

function checkRateLimit(clientId: string) {
  const now = Date.now()
  const minute = minuteBuckets.get(clientId)
  const day = dayBuckets.get(clientId)
  const nextMinute = !minute || minute.resetAt <= now
    ? { count: 0, resetAt: now + rateLimitWindowMs }
    : minute
  const nextDay = !day || day.resetAt <= now
    ? { count: 0, resetAt: now + 24 * 60 * 60 * 1000 }
    : day

  if (
    nextMinute.count >= maxGeminiRequestsPerWindow ||
    nextDay.count >= maxGeminiRequestsPerDay
  ) {
    minuteBuckets.set(clientId, nextMinute)
    dayBuckets.set(clientId, nextDay)
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((nextMinute.resetAt - now) / 1000),
    }
  }

  nextMinute.count += 1
  nextDay.count += 1
  minuteBuckets.set(clientId, nextMinute)
  dayBuckets.set(clientId, nextDay)

  return {
    allowed: true,
    retryAfterSeconds: 0,
  }
}

async function callGemini(message: string, history: ChatMessage[], context: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallbackAnswer(message, context)

  const trimmedHistory = history.slice(-6)
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const prompt = [
    'You are Abdullah Mustafa\'s portfolio assistant.',
    'Answer only using the provided portfolio context and recent chat history.',
    'If the context does not contain the answer, say you do not know from the portfolio data.',
    'Be concise, friendly, and specific. Do not invent dates, employers, links, or achievements.',
    '',
    'Portfolio context:',
    context,
    '',
    'Recent conversation:',
    trimmedHistory.map((item) => `${item.role}: ${item.content}`).join('\n') || 'None',
    '',
    `Question: ${message}`,
  ].join('\n')

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini request failed: ${res.status} ${errorText}`)
  }

  const data = await res.json() as GeminiResponse
  const outputText = data.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')

  return outputText?.trim() || fallbackAnswer(message, context)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const body = JSON.parse(await readBody(req)) as RagRequest
    const message = body.message?.trim()
    if (!message) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Message is required' }))
      return
    }

    const context = retrieveContext(message)
    const rateLimit = checkRateLimit(getClientId(req))
    if (!rateLimit.allowed) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds))
      res.setHeader('X-RAG-Mode', 'local-fallback-rate-limited')
      res.end(JSON.stringify({ answer: fallbackAnswer(message, context) }))
      return
    }

    let answer: string
    try {
      answer = await callGemini(message, body.conversationHistory ?? [], context)
    } catch (error) {
      console.error(error)
      answer = fallbackAnswer(message, context)
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-RAG-Mode', process.env.GEMINI_API_KEY ? 'gemini-or-fallback' : 'local-fallback')
    res.end(JSON.stringify({ answer }))
  } catch (error) {
    console.error(error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Could not answer message' }))
  }
}

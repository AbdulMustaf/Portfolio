/**
 * Lexical retrieval over the portfolio corpus (BM25 + query expansion).
 *
 * The corpus is ~20 chunks / ~3k tokens, so the job here is *not* to make the
 * knowledge fit a context window — it already fits many times over. Retrieval
 * exists purely to cut per-request input cost, which is ~75% of the bill.
 * Sending the top few chunks instead of everything roughly halves the cost of
 * a question and therefore doubles how far a fixed monthly budget stretches.
 *
 * Because the *only* reason to retrieve is cost, correctness is protected
 * separately: corpus.buildCoreContext() always ships an index of every entity,
 * so a retrieval miss costs detail, never existence. That asymmetry is what
 * makes a cheap lexical scorer safe here where it wouldn't be in a real
 * large-corpus RAG.
 */

import { chunks } from './corpus.js'
import type { CorpusChunk } from './corpus.js'

const K1 = 1.4
const B = 0.72

const STOPWORDS = new Set([
  // Function words. This list has to be reasonably complete: the off-topic
  // guard treats "no term overlap with the corpus" as a signal, and a single
  // unfiltered word like "is" or "of" matches nearly every chunk, which would
  // make an unrelated question look on-topic.
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'with', 'his', 'her', 'him',
  'she', 'they', 'them', 'what', 'when', 'where', 'which', 'who', 'whom', 'how', 'why',
  'does', 'did', 'has', 'have', 'had', 'was', 'were', 'been', 'being', 'can', 'could',
  'would', 'should', 'will', 'about', 'from', 'that', 'this', 'these', 'those', 'there',
  'any', 'all', 'some', 'more', 'most', 'much', 'many', 'tell', 'me', 'know', 'get',
  'is', 'of', 'in', 'on', 'at', 'to', 'it', 'its', 'as', 'by', 'or', 'if', 'so', 'do',
  'be', 'am', 'an', 'no', 'yes', 'up', 'out', 'we', 'us', 'my', 'im', 'ive', 'he',
  'into', 'over', 'than', 'then', 'also', 'just', 'like', 'very', 'their', 'other',
  'abdullah', 'mustafa',
])
/**
 * Visitor vocabulary → corpus vocabulary.
 * Each key expands the query with its values; it never replaces the original
 * term, so a query matching the corpus wording directly is unaffected.
 */
const SYNONYMS: Record<string, string[]> = {
  school: ['university', 'education', 'student', 'degree'],
  college: ['university', 'education', 'student', 'degree'],
  study: ['university', 'education', 'student', 'degree'],
  studying: ['university', 'education', 'student'],
  uni: ['university', 'education'],
  grad: ['graduate', 'education', 'university'],
  job: ['role', 'work', 'experience', 'position'],
  jobs: ['role', 'work', 'experience', 'position'],
  career: ['role', 'work', 'experience'],
  employed: ['role', 'work', 'experience'],
  employer: ['organization', 'company', 'work'],
  company: ['organization', 'work'],
  companies: ['organization', 'work'],
  internship: ['co-op', 'coop', 'intern', 'work'],
  intern: ['co-op', 'coop', 'internship'],
  coop: ['co-op', 'internship', 'work'],
  built: ['project', 'built', 'developed'],
  build: ['project', 'developed'],
  made: ['project', 'built'],
  created: ['project', 'built'],
  app: ['project', 'application'],
  apps: ['project', 'application'],
  portfolio: ['project'],
  tech: ['technologies', 'skills', 'stack'],
  stack: ['technologies', 'skills'],
  tools: ['technologies', 'skills'],
  languages: ['skills', 'python', 'javascript', 'typescript', 'java'],
  award: ['award', 'achievement', 'recognition', 'prize'],
  awards: ['award', 'achievement', 'recognition', 'prize'],
  won: ['award', 'achievement', 'place', 'competition'],
  win: ['award', 'achievement', 'competition'],
  hackathon: ['award', 'competition', 'achievement'],
  paper: ['research', 'publication', 'study'],
  publication: ['research', 'paper'],
  research: ['research', 'study', 'paper'],
  ml: ['machine', 'learning', 'model'],
  ai: ['artificial', 'intelligence', 'machine', 'learning'],
  contact: ['email', 'linkedin', 'github'],
  reach: ['email', 'contact', 'linkedin'],
  hire: ['available', 'opportunity', 'work'],
  hiring: ['available', 'opportunity', 'work'],
}

function tokenize(value: string): string[] {
  return value
    .normalize('NFKC')
    .toLowerCase()
    // Keep intra-word +, #, . and - so "c++", "node.js", "scikit-learn" survive.
    .split(/[^a-z0-9+#.-]+/)
    .map((token) => token.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

function expand(terms: string[]): string[] {
  const out = new Set(terms)
  for (const term of terms) {
    const extra = SYNONYMS[term]
    if (extra) for (const syn of extra) out.add(syn)
  }
  return [...out]
}

// ─── Index, built once at module load ─────────────────────────────────────────

interface IndexedChunk {
  chunk: CorpusChunk
  termFreq: Map<string, number>
  length: number
  /** Terms from the title + aliases, boosted at score time. */
  salient: Set<string>
}

const index: IndexedChunk[] = chunks.map((chunk) => {
  const bodyTerms = tokenize(`${chunk.title} ${chunk.text}`)
  const termFreq = new Map<string, number>()
  for (const term of bodyTerms) {
    termFreq.set(term, (termFreq.get(term) ?? 0) + 1)
  }
  return {
    chunk,
    termFreq,
    length: bodyTerms.length,
    salient: new Set(tokenize(`${chunk.title} ${chunk.aliases.join(' ')}`)),
  }
})

const avgLength = index.reduce((sum, entry) => sum + entry.length, 0) / Math.max(1, index.length)

const idf = new Map<string, number>()
for (const entry of index) {
  for (const term of entry.termFreq.keys()) {
    idf.set(term, (idf.get(term) ?? 0) + 1)
  }
}
for (const [term, docCount] of idf) {
  // Standard BM25 IDF with the +1 smoothing that keeps common terms non-negative.
  idf.set(term, Math.log(1 + (index.length - docCount + 0.5) / (docCount + 0.5)))
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface RetrievalResult {
  chunks: CorpusChunk[]
  /** Best single-chunk score; 0 means the query shares no vocabulary with the corpus. */
  topScore: number
}

export function retrieve(query: string, limit = 3): RetrievalResult {
  const terms = expand(tokenize(query))
  if (terms.length === 0) return { chunks: [], topScore: 0 }

  const scored = index.map((entry) => {
    let score = 0
    for (const term of terms) {
      const tf = entry.termFreq.get(term)
      if (!tf) continue
      const weight = idf.get(term) ?? 0
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (entry.length / avgLength)))
      // A hit in the title or aliases is a much stronger signal of aboutness
      // than the same term buried in a highlight paragraph.
      score += weight * norm * (entry.salient.has(term) ? 1.6 : 1)
    }
    return { chunk: entry.chunk, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const topScore = scored.length ? scored[0].score : 0
  if (topScore <= 0) return { chunks: [], topScore: 0 }

  // Drop trailing chunks that are far weaker than the best match: padding the
  // prompt with near-irrelevant context costs tokens and dilutes the answer.
  const floor = topScore * 0.25
  const selected = scored
    .slice(0, limit)
    .filter((entry) => entry.score >= floor)
    .map((entry) => entry.chunk)

  return { chunks: selected, topScore }
}

export function formatChunks(selected: CorpusChunk[]): string {
  if (selected.length === 0) return ''
  return selected.map((chunk) => `### ${chunk.title}\n${chunk.text}`).join('\n\n')
}

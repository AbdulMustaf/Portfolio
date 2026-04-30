import { useState, useEffect, useRef, useCallback } from 'react'
import { FaTerminal } from 'react-icons/fa'
import { getViewerCount, sendRagMessage } from '../api/terminalApi'
import type { ChatMessage } from '../api/terminalApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type LineType = 'info' | 'user' | 'bot' | 'error'

interface TerminalLine {
  id: string
  text: string
  type: LineType
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPING_SPEED = 26       // ms per character (base)
const TYPING_VARIANCE = 16    // max extra ms for realism
const INTRO_PAUSE = 650       // ms pause between intro messages

// ─── Utilities ────────────────────────────────────────────────────────────────

let _lineId = 0
const uid = () => `tl-${++_lineId}`
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function ordinal(n: number): string {
  const v = n % 100
  const s = n % 10
  if (v >= 11 && v <= 13) return `${n}th`
  if (s === 1) return `${n}st`
  if (s === 2) return `${n}nd`
  if (s === 3) return `${n}rd`
  return `${n}th`
}

// ─── Sub-component: a single rendered terminal line ───────────────────────────

function TerminalLineRow({
  line,
  typing = false,
}: {
  line: TerminalLine
  typing?: boolean
}) {
  if (line.type === 'user') {
    return (
      <div className="flex gap-2 mb-2 flex-wrap items-start">
        <span className="text-[#22c55e] flex-shrink-0 select-none font-mono text-xs sm:text-sm leading-relaxed">
          visitor@portfolio:~$
        </span>
        <span className="text-[#e2e2e2] whitespace-pre-wrap break-all flex-1 font-mono text-xs sm:text-sm leading-relaxed">
          {line.text}
        </span>
      </div>
    )
  }

  const { prefix, textCls } = styleFor(line.type)
  return (
    <div className={`flex gap-2 mb-2 items-start ${textCls}`}>
      <span className="flex-shrink-0 select-none opacity-60 font-mono text-xs sm:text-sm leading-relaxed">
        {prefix}
      </span>
      <span className="whitespace-pre-wrap break-words flex-1 font-mono text-xs sm:text-sm leading-relaxed">
        {line.text}
        {typing && <span className="animate-term-blink ml-0.5">▌</span>}
      </span>
    </div>
  )
}

function styleFor(type: LineType): { prefix: string; textCls: string } {
  switch (type) {
    case 'info':  return { prefix: '$',  textCls: 'text-[#22c55e]' }
    case 'bot':   return { prefix: '→',  textCls: 'text-[#86efac]' }
    case 'error': return { prefix: '✗',  textCls: 'text-[#f87171]' }
    default:      return { prefix: '$',  textCls: 'text-[#22c55e]' }
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MiniTerminal() {
  const [isOpen, setIsOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [typingLine, setTypingLine] = useState<TerminalLine | null>(null)
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null)
  const [inputReady, setInputReady] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])

  // cancelRef: stops character-level typing mid-word
  const cancelRef = useRef(false)
  // seqRef: invalidates a whole async intro/submit sequence if closed/reopened
  const seqRef = useRef(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll terminal body to bottom as content grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, typingLine, loadingMsg])

  // Focus the input once it becomes available
  useEffect(() => {
    if (inputReady && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [inputReady, isOpen])

  // ── Typing engine ──────────────────────────────────────────────────────────

  const typeMessage = useCallback(
    (text: string, type: LineType): Promise<void> =>
      new Promise<void>((resolve) => {
        if (cancelRef.current) { resolve(); return }

        const id = uid()
        let i = 0
        setTypingLine({ id, text: '', type })

        function tick() {
          if (cancelRef.current) {
            setTypingLine(null)
            resolve()
            return
          }
          i++
          setTypingLine({ id, text: text.slice(0, i), type })
          if (i < text.length) {
            setTimeout(tick, TYPING_SPEED + Math.random() * TYPING_VARIANCE)
          } else {
            setTypingLine(null)
            setLines((prev) => [...prev, { id, text, type }])
            resolve()
          }
        }

        setTimeout(tick, TYPING_SPEED + Math.random() * TYPING_VARIANCE)
      }),
    [],
  )

  // ── Intro sequence ─────────────────────────────────────────────────────────

  const runIntro = useCallback(
    async (seq: number) => {
      cancelRef.current = false
      setLines([])
      setTypingLine(null)
      setInputReady(false)
      setHistory([])
      setInput('')
      setLoadingMsg(null)

      try {
        setLoadingMsg('Connecting...')
        const count = await getViewerCount()
        setLoadingMsg(null)

        if (seqRef.current !== seq) return

        await typeMessage(
          `You are the ${ordinal(count)} viewer on this website!`,
          'info',
        )
        await sleep(INTRO_PAUSE)
        if (seqRef.current !== seq) return

        await typeMessage(
          'This terminal is a RAG system. Ask me anything about Abdullah.',
          'info',
        )
        await sleep(400)
        if (seqRef.current !== seq) return

        setInputReady(true)
      } catch {
        if (seqRef.current === seq) {
          setLoadingMsg(null)
          await typeMessage('Failed to initialize. Please try again.', 'error')
        }
      }
    },
    [typeMessage],
  )

  // ── Open / close ───────────────────────────────────────────────────────────

  const handleOpen = useCallback(() => {
    const seq = ++seqRef.current
    setIsOpen(true)
    // runIntro is triggered by the useEffect below once isOpen flips
    // Store seq so the effect can pass it
    seqRef.current = seq
  }, [])

  const handleClose = useCallback(() => {
    seqRef.current++
    cancelRef.current = true
    setIsOpen(false)
    setMinimized(false)
    setMaximized(false)
    setInputReady(false)
    setLoadingMsg(null)
  }, [])

  const handleMinimize = useCallback(() => {
    setMinimized((m) => !m)
  }, [])

  const handleMaximize = useCallback(() => {
    setMaximized((m) => !m)
    setMinimized(false)
  }, [])

  // Start intro whenever the terminal opens
  useEffect(() => {
    if (isOpen) {
      const seq = ++seqRef.current
      runIntro(seq)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const msg = input.trim()
      if (!msg) return

      const seq = seqRef.current
      setInput('')
      setInputReady(false)
      setLines((prev) => [...prev, { id: uid(), text: msg, type: 'user' }])
      setLoadingMsg('Thinking...')

      const nextHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: msg },
      ]

      try {
        const answer = await sendRagMessage(msg, nextHistory)

        if (seqRef.current !== seq) return

        setHistory([...nextHistory, { role: 'assistant', content: answer }])
        setLoadingMsg(null)
        await typeMessage(answer, 'bot')

        if (seqRef.current === seq) {
          setInputReady(true)
        }
      } catch {
        if (seqRef.current !== seq) return
        setLoadingMsg(null)
        await typeMessage('Error: Could not reach the RAG API. Please try again.', 'error')
        setInputReady(true)
      }
    },
    [input, history, typeMessage],
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  const TERMINAL_FONT =
    '"Fira Code", "Cascadia Code", ui-monospace, "SF Mono", Consolas, "Liberation Mono", monospace'

  return (
    <>
      {/* ── Terminal popup ──────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-[76px] right-6 z-50 transition-all duration-300 origin-bottom-right
          ${isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
          }`}
        style={{
          width: maximized
            ? 'min(720px, calc(100vw - 24px))'
            : 'min(460px, calc(100vw - 24px))',
        }}
        role="dialog"
        aria-label="Portfolio terminal"
        aria-modal="true"
      >
        <div
          className="rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          {/* macOS title bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2d2d2d] border-b border-black/40 select-none">
            {/* Red = close */}
            <button
              onClick={handleClose}
              aria-label="Close terminal"
              title="Close"
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
            />
            {/* Yellow = minimize / restore */}
            <button
              onClick={handleMinimize}
              aria-label={minimized ? 'Restore terminal' : 'Minimize terminal'}
              title={minimized ? 'Restore' : 'Minimize'}
              className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 transition-all flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
            />
            {/* Green = maximize / restore */}
            <button
              onClick={handleMaximize}
              aria-label={maximized ? 'Restore terminal size' : 'Maximize terminal'}
              title={maximized ? 'Restore' : 'Maximize'}
              className="w-3 h-3 rounded-full bg-[#28ca41] hover:brightness-110 transition-all flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
            />
            <span className="ml-2 text-[#7a7a7a] text-xs flex-1 text-center tracking-tight">
              terminal — bash
            </span>
          </div>

          {/* Terminal body — height drives minimize/maximize, overflow-hidden prevents scrollbar flash */}
          <div
            className="bg-[#0f0f0f] overflow-hidden transition-all duration-300"
            style={{
              height: minimized
                ? '0px'
                : maximized
                  ? 'clamp(400px, 60vh, 520px)'
                  : 'clamp(200px, 40vh, 290px)',
            }}
          >
          {/* Scrollable inner */}
          <div className="h-full overflow-y-auto p-4">
            {/* Completed lines */}
            {lines.map((line) => (
              <TerminalLineRow key={line.id} line={line} />
            ))}

            {/* Currently-typing line */}
            {typingLine && (
              <TerminalLineRow line={typingLine} typing />
            )}

            {/* Loading / thinking indicator */}
            {loadingMsg && (
              <div className="flex gap-2 mb-2 items-center text-[#808080] font-mono text-xs sm:text-sm">
                <span className="animate-pulse text-[#22c55e]">●</span>
                <span>{loadingMsg}</span>
              </div>
            )}

            {/* Input prompt — shown once intro finishes */}
            {inputReady && !loadingMsg && (
              <form
                onSubmit={handleSubmit}
                className="flex gap-2 items-center mt-1"
              >
                <span className="text-[#22c55e] flex-shrink-0 font-mono text-xs sm:text-sm select-none">
                  visitor@portfolio:~$
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && handleClose()}
                  className="flex-1 min-w-0 bg-transparent text-[#e2e2e2] outline-none caret-green-400 font-mono text-xs sm:text-sm placeholder-[#444]"
                  placeholder="ask me anything..."
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Ask a question about Abdullah"
                />
              </form>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>
          {/* end scrollable inner */}
          </div>
          {/* end terminal body */}
        </div>
      </div>

      {/* ── Floating button ─────────────────────────────────────────────────── */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? 'Close terminal' : 'Open terminal'}
        aria-expanded={isOpen}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg
          text-white text-sm font-semibold shadow-lg transition-all duration-200
          hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2
          focus-visible:ring-netflix-red/70 ${!isOpen ? 'animate-[redPulse_3s_ease-in-out_infinite]' : ''}`}
        style={{
          background: 'linear-gradient(135deg, #e50914 0%, #b8060d 100%)',
        }}
      >
        <FaTerminal size={13} aria-hidden="true" />
        <span>Press me</span>
      </button>
    </>
  )
}

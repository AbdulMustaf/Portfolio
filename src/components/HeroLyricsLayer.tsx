import { heroLyricsData } from '../data/heroLyricsData'

const lyricRows = [
  { top: '13%', left: '50%', size: 'clamp(2.4rem, 6vw, 7rem)', speed: '34s', opacity: 0.16 },
  { top: '24%', left: '47%', size: 'clamp(1.8rem, 4.8vw, 5.6rem)', speed: '28s', opacity: 0.12 },
  { top: '39%', left: '52%', size: 'clamp(2rem, 5.2vw, 6rem)', speed: '32s', opacity: 0.14 },
  { top: '55%', left: '48%', size: 'clamp(1.6rem, 4.2vw, 5rem)', speed: '30s', opacity: 0.11 },
  { top: '70%', left: '53%', size: 'clamp(2.2rem, 5.6vw, 6.6rem)', speed: '36s', opacity: 0.13 },
]

export default function HeroLyricsLayer() {
  const repeatedLyrics = [...heroLyricsData, ...heroLyricsData]

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>
        {`
          @keyframes heroLyricsDrift {
            from { transform: translate3d(-8%, 0, 0); }
            to { transform: translate3d(-58%, 0, 0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .hero-lyrics-track {
              animation: none !important;
            }
          }
        `}
      </style>

      {lyricRows.map((row, rowIndex) => (
        <div
          key={`${row.top}-${row.left}`}
          className="absolute whitespace-nowrap hero-lyrics-track"
          style={{
            top: row.top,
            left: row.left,
            fontSize: row.size,
            opacity: row.opacity,
            animation: `heroLyricsDrift ${row.speed} linear infinite`,
            animationDirection: rowIndex % 2 === 0 ? 'normal' : 'reverse',
          }}
        >
          {repeatedLyrics.map((line, lyricIndex) => (
            <span
              key={`${line}-${lyricIndex}`}
              className="mx-8 font-black uppercase text-white tracking-[0.18em]"
            >
              {line}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

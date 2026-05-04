import { FaPlay } from 'react-icons/fa'

interface Props {
  onClick?: () => void
  label?: string
}

export default function PlayButton({ onClick, label = 'Play' }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded text-sm sm:text-base hover:bg-opacity-80 transition-all duration-200 active:scale-95"
      aria-label={label}
    >
      <FaPlay size={14} />
      {label}
    </button>
  )
}

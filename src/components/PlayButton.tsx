import { FaPlay } from 'react-icons/fa'

interface Props {
  onClick?: () => void
  label?: string
}

export default function PlayButton({ onClick, label = 'Play' }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded text-base hover:bg-opacity-80 transition-all duration-200 active:scale-95"
      aria-label={label}
    >
      <FaPlay size={14} />
      {label}
    </button>
  )
}

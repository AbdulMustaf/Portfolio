import { FaInfoCircle } from 'react-icons/fa'

interface Props {
  onClick?: () => void
  label?: string
}

export default function MoreInfoButton({ onClick, label = 'More Info' }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-netflix-dark-3 bg-opacity-80 text-white font-semibold px-6 py-3 rounded text-base hover:bg-opacity-60 transition-all duration-200 border border-white/20 active:scale-95"
      aria-label={label}
    >
      <FaInfoCircle size={16} />
      {label}
    </button>
  )
}

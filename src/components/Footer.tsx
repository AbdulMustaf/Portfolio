import { profileData } from '../data/profileData'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-text-secondary text-xs">
        <p className="font-bold text-netflix-red text-base tracking-tighter">AM</p>
        <p>
          © {year} {profileData.name}. Built with React + GSAP + Tailwind.
        </p>
        <p>Deployed on Vercel.</p>
      </div>
    </footer>
  )
}

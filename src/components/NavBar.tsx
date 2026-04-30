import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaBars, FaTimes } from 'react-icons/fa'
import { profileData } from '../data/profileData'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Experience', href: '/experience' },
  { label: 'Skills', href: '/skills' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/contact' },
]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-netflix-dark shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-netflix-red font-black text-lg sm:text-2xl tracking-tighter hover:opacity-80 transition-opacity"
            aria-label="Abdullah Mustafa — Home"
          >
            {profileData.name}
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-6 list-none">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.href)
                      ? 'text-white font-semibold border-b-2 border-netflix-red pb-0.5'
                      : 'text-text-primary hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Hamburger */}
          <button
            className="md:hidden text-white p-2 focus:outline-none focus:ring-2 focus:ring-netflix-red rounded"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
        <aside
          className={`absolute top-0 right-0 h-full w-72 bg-netflix-dark-2 shadow-2xl transform transition-transform duration-300 flex flex-col pt-20 px-8 gap-6 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <p className="text-text-secondary text-xs uppercase tracking-widest mb-2">Navigation</p>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`text-lg font-medium transition-colors ${
                isActive(link.href) ? 'text-netflix-red' : 'text-text-primary hover:text-netflix-red'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-auto pb-8 text-text-secondary text-sm">
            {profileData.name}
          </div>
        </aside>
      </div>
    </>
  )
}

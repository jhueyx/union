// Union — top navigation. Hidden in coming-soon mode. Uses React Router links.
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SITE_MODE, WEDDING } from '../config'

const LINKS = [
  { label: 'Our Story', to: '/story' },
  { label: 'Save the Date', to: '/save-the-date' },
  { label: 'Invite', to: '/invitation' },
  { label: 'RSVP', to: '/rsvp' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Travel', to: '/travel' },
  { label: 'Registry', to: '/registry' },
  { label: 'FAQ', to: '/faq' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-xs tracking-[0.15em] uppercase transition-colors duration-150',
    isActive
      ? 'text-zinc-900 dark:text-zinc-50'
      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50',
  ].join(' ')

export default function Nav() {
  const [open, setOpen] = useState(false)

  // The nav does not render at all in coming-soon mode.
  if (SITE_MODE === 'coming-soon') return null

  return (
    <header className="sticky top-0 z-50 bg-[#fafafa]/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-900">
      <div className="max-w-[700px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="text-xs tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-150"
        >
          {WEDDING.coupleNames}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Site navigation" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {LINKS.map(({ label, to }) => (
              <li key={to} className="whitespace-nowrap">
                <NavLink to={to} className={linkClass}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-lg leading-none text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-150"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-zinc-100 dark:border-zinc-900 bg-[#fafafa] dark:bg-[#0a0a0a]"
        >
          <ul className="max-w-[700px] mx-auto px-6 py-4 flex flex-col gap-4">
            {LINKS.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

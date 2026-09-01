// Union — minimal dark layout for the admin area (not public-facing).
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { setPlanningErrorReporter } from '../lib/planning'
import Login from '../pages/admin/Login'
import type { Session } from '@supabase/supabase-js'

// The planning suite. Overview first, then the two that matter most day to day.
const SECTIONS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/guests', label: 'Guests' },
  { to: '/admin/seating', label: 'Seating' },
  { to: '/admin/checklist', label: 'Checklist' },
  { to: '/admin/timeline', label: 'Timeline' },
  { to: '/admin/budget', label: 'Budget' },
  { to: '/admin/vendors', label: 'Vendors' },
  { to: '/admin/gifts', label: 'Gifts' },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/exports', label: 'Exports' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [toast, setToast] = useState<string | null>(null)

  // planning.ts is not a component, so it cannot reach state directly. Register
  // a reporter once so a rejected write surfaces instead of dying in console.
  useEffect(() => {
    setPlanningErrorReporter(msg => {
      setToast(msg)
      setTimeout(() => setToast(null), 5000)
    })
    return () => setPlanningErrorReporter(null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // A web manifest's start_url is fixed - "Add to Home Screen" always
  // launches there regardless of which page you saved it from. The public
  // site's manifest points start_url at "/", so an icon saved from /admin
  // was launching into the coming-soon page instead. Swapping to a
  // dedicated admin manifest (start_url: "/admin", dark theme colors
  // matching this layout's bg-[#0a0a0a]) while this layout is mounted
  // fixes that - RootLayout swaps it back for the public site.
  useEffect(() => {
    const link = document.getElementById('webManifest') as HTMLLinkElement | null
    if (!link) return
    const original = link.href
    link.href = '/manifest-admin.json'
    return () => { link.href = original }
  }, [])

  // Still loading session from Supabase
  if (session === undefined) return null

  // Not logged in — show login form
  if (session === null) return <Login />

  // Logged in — show dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <header className="border-b border-zinc-900">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] uppercase text-zinc-400">
            Planning — Sally &amp; Jason
          </span>
          <button
            onClick={() => supabase.auth.signOut({ scope: 'local' })}
            className="text-xs tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
        {/* Horizontal nav rather than a sidebar: the seating floor plan wants
            the full width, and this collapses to a scrollable strip on mobile. */}
        <nav className="max-w-[1200px] mx-auto px-6 flex gap-6 overflow-x-auto">
          {SECTIONS.map(s => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                'text-[10px] tracking-[0.18em] uppercase py-3 whitespace-nowrap border-b transition-colors ' +
                (isActive
                  ? 'text-zinc-50 border-zinc-50'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300')
              }
            >
              {s.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-[2px] bg-rose-950 border border-rose-800 text-rose-200 text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}

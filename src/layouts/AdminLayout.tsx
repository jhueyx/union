// Union — minimal dark layout for the admin area (not public-facing).
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Login from '../pages/admin/Login'
import type { Session } from '@supabase/supabase-js'

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Still loading session from Supabase
  if (session === undefined) return null

  // Not logged in — show login form
  if (session === null) return <Login />

  // Logged in — show dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <header className="border-b border-zinc-900">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] uppercase text-zinc-400">
            Admin — Union
          </span>
          <button
            onClick={() => supabase.auth.signOut({ scope: 'local' })}
            className="text-xs tracking-[0.15em] uppercase text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

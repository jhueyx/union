// Union — minimal dark layout for the admin area (not public-facing).
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <header className="border-b border-zinc-900">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center">
          <span className="text-xs tracking-[0.2em] uppercase text-zinc-400">
            Admin — Union
          </span>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

// Union — 404 page.
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
        404
      </p>
      <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-4">
        This page doesn’t exist
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
        The page you’re looking for couldn’t be found.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-[2px] text-xs font-medium tracking-[0.18em] uppercase px-7 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      >
        Back Home
      </Link>
    </div>
  )
}

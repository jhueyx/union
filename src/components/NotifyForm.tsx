import { useState, useRef, useEffect, type FormEvent } from 'react'

interface Props {
  onDismiss: () => void
}

export default function NotifyForm({ onDismiss }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitted' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    // Wire up to your preferred service (Resend, Mailchimp, Supabase, etc.)
    // For now: optimistic success — replace this block with your API call.
    setStatus('submitted')
  }

  if (status === 'submitted') {
    return (
      <div className="animate-fade-in mt-10 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500 tracking-wide">
          We'll be in touch.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-form-enter mt-10 w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3">
          {/* Email input — bottom-border only for a clean, editorial look */}
          <div className="relative">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-label="Email address"
              className={[
                'w-full bg-transparent',
                'px-0 py-2.5',
                'text-sm text-zinc-900 dark:text-zinc-50',
                'placeholder-zinc-400 dark:placeholder-zinc-600',
                'border-b border-zinc-200 dark:border-zinc-800',
                'focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500',
                'transition-colors duration-200',
                'text-center tracking-wide',
              ].join(' ')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              type="submit"
              className={[
                'text-xs uppercase tracking-[0.18em] font-medium',
                'text-zinc-900 dark:text-zinc-50',
                'hover:text-black dark:hover:text-white',
                'transition-colors duration-150',
                'py-1',
              ].join(' ')}
            >
              Send
            </button>
            <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />
            <button
              type="button"
              onClick={onDismiss}
              className={[
                'text-xs uppercase tracking-[0.18em]',
                'text-zinc-400 dark:text-zinc-600',
                'hover:text-zinc-600 dark:hover:text-zinc-400',
                'transition-colors duration-150',
                'py-1',
              ].join(' ')}
            >
              Dismiss
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

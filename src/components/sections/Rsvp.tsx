import { useState, type FormEvent } from 'react'
import Section from '../Section'
import { WEDDING } from '../../config'

export default function Rsvp() {
  const [name, setName] = useState('')
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !attending) return
    // TODO: POST to your RSVP endpoint (Supabase, Resend, Airtable, etc.)
    setSubmitted(true)
  }

  return (
    <Section id="rsvp" label="RSVP">
      {WEDDING.rsvpDeadline && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-600 -mt-6 mb-12">
          Kindly reply by {WEDDING.rsvpDeadline}.
        </p>
      )}

      {submitted ? (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Thank you. We look forward to celebrating with you.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="max-w-xs mx-auto space-y-8">

          {/* Name */}
          <div>
            <label
              htmlFor="rsvp-name"
              className="block text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-2"
            >
              Name
            </label>
            <input
              id="rsvp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className={[
                'w-full bg-transparent px-0 py-2',
                'border-b border-zinc-200 dark:border-zinc-800',
                'text-sm text-zinc-900 dark:text-zinc-50',
                'placeholder-zinc-400 dark:placeholder-zinc-600',
                'focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500',
                'transition-colors duration-200',
              ].join(' ')}
            />
          </div>

          {/* Attendance */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-4">
              Attendance
            </p>
            <div className="flex flex-col gap-3">
              {([
                { value: 'yes', label: 'Joyfully accepts' },
                { value: 'no', label: 'Regretfully declines' },
              ] as const).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer group">
                  {/* Custom radio */}
                  <span
                    className={[
                      'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150',
                      attending === value
                        ? 'border-zinc-900 dark:border-zinc-50'
                        : 'border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-500',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {attending === value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-50" />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="attending"
                    value={value}
                    checked={attending === value}
                    onChange={() => setAttending(value)}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'text-sm transition-colors duration-150',
                      attending === value
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={[
              'w-full py-3.5 rounded-[2px]',
              'text-xs font-medium tracking-[0.2em] uppercase',
              'bg-zinc-900 dark:bg-zinc-50',
              'text-zinc-50 dark:text-zinc-900',
              'transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:shadow-md',
              'active:translate-y-0 active:shadow-none',
            ].join(' ')}
          >
            Send RSVP
          </button>
        </form>
      )}
    </Section>
  )
}

import { useState } from 'react'
import { SITE_MODE, WEDDING } from '../config'
import Monogram from './Monogram'
import NotifyForm from './NotifyForm'

const isLive = SITE_MODE === 'live'

export default function Hero() {
  const [notifyOpen, setNotifyOpen] = useState(false)

  return (
    <div className="w-full max-w-[700px] mx-auto text-center">

      {/* ── Monogram ─────────────────────────────────────────── */}
      <div className="mb-7 md:mb-8 text-zinc-900 dark:text-zinc-50">
        <Monogram />
      </div>

      {/* ── Names ─────────────────────────────────────────────── */}
      <h1
        className={[
          'font-[300] tracking-[0.12em]',
          'text-2xl md:text-4xl',
          'text-zinc-900 dark:text-zinc-50',
          'mb-4',
        ].join(' ')}
      >
        Sally &amp; Jason
      </h1>

      {/* ── Tagline ───────────────────────────────────────────── */}
      <p
        className={[
          'italic text-sm md:text-base tracking-wide',
          'text-zinc-400 dark:text-zinc-500',
          isLive ? 'mb-10' : 'mb-12 md:mb-14',
        ].join(' ')}
      >
        A celebration, thoughtfully designed.
      </p>

      {/* ── Hairline divider ──────────────────────────────────── */}
      <div
        className="w-10 h-px bg-zinc-200 dark:bg-zinc-800 mx-auto mb-12 md:mb-14"
        role="separator"
        aria-hidden="true"
      />

      {isLive ? (

        /* ── Live mode: date + venue + scroll prompt ──────────── */
        <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          {WEDDING.dateShort && (
            <p className="tracking-[0.15em]">{WEDDING.dateShort}</p>
          )}
          {WEDDING.venue.city && (
            <p className="tracking-wide">{WEDDING.venue.city}</p>
          )}
          {(!WEDDING.dateShort && !WEDDING.venue.city) && (
            <p className="text-zinc-400 dark:text-zinc-600">Details coming soon.</p>
          )}
          <a
            href="#details"
            className="inline-block mt-8 text-xs tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-150"
          >
            View Details ↓
          </a>
        </div>

      ) : (

        /* ── Coming-soon mode: copy + notify ─────────────────── */
        <>
          <div
            className={[
              'space-y-5',
              'text-sm md:text-base leading-[1.85]',
              'text-zinc-500 dark:text-zinc-400',
              'max-w-[520px] mx-auto',
              'mb-14 md:mb-16',
            ].join(' ')}
          >
            <p>We're looking forward to celebrating with the people who matter most.</p>
            <p>Our wedding website is currently being prepared as we finalize the details.</p>
            <p>We'll share everything here soon.</p>
          </div>

          {/* CTA */}
          {!notifyOpen && (
            <div className="flex flex-col items-center gap-5">
              <button
                onClick={() => setNotifyOpen(true)}
                aria-label="Get notified when the site launches"
                className={[
                  'px-9 py-3.5 rounded-[2px]',
                  'bg-zinc-900 dark:bg-zinc-50',
                  'text-zinc-50 dark:text-zinc-900',
                  'text-xs font-medium tracking-[0.2em] uppercase',
                  'transition-all duration-200 ease-out',
                  'hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
                  'dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.08)]',
                  'active:translate-y-0 active:shadow-none',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4',
                  'focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50',
                ].join(' ')}
              >
                Notify Me
              </button>
              <span
                className="text-xs tracking-[0.25em] uppercase text-zinc-300 dark:text-zinc-700"
                aria-label="Site coming soon"
              >
                Coming Soon
              </span>
            </div>
          )}

          {notifyOpen && (
            <NotifyForm onDismiss={() => setNotifyOpen(false)} />
          )}
        </>
      )}

    </div>
  )
}

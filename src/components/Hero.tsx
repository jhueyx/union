import { useSiteContent } from '../lib/siteContent'
import Monogram from './Monogram'

export default function Hero() {
  const { isLive, wedding, comingSoonMessage } = useSiteContent()

  return (
    <div className="w-full max-w-[700px] mx-auto text-center">

      {/* ── Monogram ─────────────────────────────────────────── */}
      <div className="mb-7 md:mb-8 text-zinc-900">
        <Monogram />
      </div>

      {/* ── Names ─────────────────────────────────────────────── */}
      <h1
        className={[
          'font-[300] tracking-[0.12em]',
          'text-2xl md:text-4xl',
          'text-zinc-900',
          'mb-4',
        ].join(' ')}
      >
        Sally &amp; Jason
      </h1>

      {/* ── Tagline ───────────────────────────────────────────── */}
      <p
        className={[
          'italic text-sm md:text-base tracking-wide',
          'text-zinc-600',
          isLive ? 'mb-10' : 'mb-12 md:mb-14',
        ].join(' ')}
      >
        A celebration, thoughtfully designed.
      </p>

      {/* ── Hairline divider ──────────────────────────────────── */}
      <div
        className="w-10 h-px bg-zinc-200 mx-auto mb-12 md:mb-14"
        role="separator"
        aria-hidden="true"
      />

      {isLive ? (

        /* ── Live mode: date + venue + scroll prompt ──────────── */
        <div className="space-y-3 text-sm text-zinc-500">
          {wedding.dateShort && (
            <p className="tracking-[0.15em]">{wedding.dateShort}</p>
          )}
          {wedding.venue.city && (
            <p className="tracking-wide">{wedding.venue.city}</p>
          )}
          {(!wedding.dateShort && !wedding.venue.city) && (
            <p className="text-zinc-600">Details coming soon.</p>
          )}
          <a
            href="#details"
            className="inline-block mt-8 text-xs tracking-[0.2em] uppercase text-zinc-600 hover:text-zinc-900 transition-colors duration-150"
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
              'text-zinc-500',
              'max-w-[520px] mx-auto',
              'mb-14 md:mb-16',
            ].join(' ')}
          >
            {comingSoonMessage.map((line, i) => <p key={i}>{line}</p>)}
          </div>

          <span
            className="text-xs tracking-[0.25em] uppercase text-zinc-600"
            aria-label="Site coming soon"
          >
            Coming Soon
          </span>
        </>
      )}

    </div>
  )
}

// Union — formal invitation page.
import { Link } from 'react-router-dom'
import { WEDDING } from '../config'
import { WEDDING_EVENTS } from '../data/mock'

const EM = '\u2014'

const PRIMARY_BTN =
  'inline-flex items-center justify-center rounded-[2px] text-xs font-medium tracking-[0.18em] uppercase px-7 py-3 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
const SECONDARY_BTN =
  'inline-flex items-center justify-center rounded-[2px] text-xs font-medium tracking-[0.18em] uppercase px-7 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-200'

export default function Invitation() {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
        Invitation
      </p>

      <h1
        className="text-5xl md:text-7xl text-zinc-900 dark:text-zinc-50 mb-10"
        style={{ fontFamily: "'Great Vibes', cursive", lineHeight: 1.1 }}
      >
        Sally &amp; Jason
      </h1>

      <p className="text-sm md:text-base leading-[1.9] text-zinc-500 dark:text-zinc-400 max-w-[520px] mx-auto mb-12">
        Together with their families, request the honour of your presence at the
        celebration of their marriage.
      </p>

      <div className="w-10 h-px bg-zinc-200 dark:bg-zinc-800 mx-auto mb-12" aria-hidden="true" />

      <dl className="space-y-6 mb-14">
        <div>
          <dt className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-1">Date</dt>
          <dd className="text-lg font-[300] text-zinc-900 dark:text-zinc-50">{WEDDING.date || EM}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-1">Time</dt>
          <dd className="text-lg font-[300] text-zinc-900 dark:text-zinc-50">{WEDDING.time || EM}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-1">Venue</dt>
          <dd className="text-lg font-[300] text-zinc-900 dark:text-zinc-50">{WEDDING.venue.name || EM}</dd>
          {WEDDING.venue.city && (
            <dd className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{WEDDING.venue.city}</dd>
          )}
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-1">Dress Code</dt>
          <dd className="text-lg font-[300] text-zinc-900 dark:text-zinc-50">{WEDDING.dressCode || 'Black Tie Optional'}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-1">Kindly Reply By</dt>
          <dd className="text-lg font-[300] text-zinc-900 dark:text-zinc-50">{WEDDING.rsvpDeadline || EM}</dd>
        </div>
      </dl>

      {/* Event flow preview */}
      <div className="mb-14">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-6">
          The Celebration
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 tracking-wide">
          {WEDDING_EVENTS.map((e) => e.name).join('  ·  ')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link to="/rsvp" className={PRIMARY_BTN}>RSVP</Link>
        <Link to="/travel" className={SECONDARY_BTN}>Travel Info</Link>
        <Link to="/registry" className={SECONDARY_BTN}>Registry</Link>
      </div>
    </div>
  )
}

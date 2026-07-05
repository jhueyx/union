// Union — schedule / timeline of wedding-day events.
import { WEDDING_EVENTS } from '../data/mock'

export default function SchedulePage() {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-12 text-center">
        Schedule
      </p>

      <div className="max-w-md mx-auto space-y-10">
        {WEDDING_EVENTS.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center">
            Details coming soon.
          </p>
        )}
        {WEDDING_EVENTS.map((evt) => (
          <div
            key={evt.id}
            className="flex gap-6 border-b border-zinc-100 dark:border-zinc-900 pb-8 last:border-0"
          >
            <div className="w-20 shrink-0 pt-0.5">
              <p className="text-xs tabular-nums tracking-[0.08em] text-zinc-900 dark:text-zinc-50">
                {evt.time}
              </p>
              {evt.endTime && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                  until {evt.endTime}
                </p>
              )}
            </div>
            <div>
              <p className="text-base font-[300] tracking-[0.06em] text-zinc-900 dark:text-zinc-50">
                {evt.name}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {evt.location}
              </p>
              {evt.description && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2 leading-relaxed">
                  {evt.description}
                </p>
              )}
              {evt.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(evt.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-[10px] tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  View Map ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

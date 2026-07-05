// Union — travel page: hotels and transportation.
import { TRAVEL_RECOMMENDATIONS } from '../data/mock'

export default function TravelPage() {
  const hotels = TRAVEL_RECOMMENDATIONS.filter((t) => t.type === 'hotel')
  const transport = TRAVEL_RECOMMENDATIONS.filter((t) => t.type === 'transport')

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-12 text-center">
        Travel & Stay
      </p>

      <div className="max-w-md mx-auto">
        <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-6">
          Where to Stay
        </p>
        <div className="space-y-4 mb-16">
          {hotels.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              Hotel recommendations coming soon.
            </p>
          )}
          {hotels.map((h) => (
            <div
              key={h.id}
              className="border border-zinc-100 dark:border-zinc-900 rounded-[2px] p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-[300] text-zinc-900 dark:text-zinc-50">
                  {h.name}
                </p>
                {h.priceRange && (
                  <span className="text-[10px] tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
                    {h.priceRange}
                  </span>
                )}
              </div>
              {h.address && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {h.address}
                </p>
              )}
              {h.note && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2 leading-relaxed">
                  {h.note}
                </p>
              )}
              {h.bookingCode && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Booking code:{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {h.bookingCode}
                  </span>
                </p>
              )}
              {h.url && (
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-[10px] tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  Book Now ↗
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-6">
          Getting Here
        </p>
        <div className="space-y-6">
          {transport.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              Transport details coming soon.
            </p>
          )}
          {transport.map((t) => (
            <div key={t.id} className="border-b border-zinc-100 dark:border-zinc-900 pb-5 last:border-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {t.name}
                {t.priceRange && (
                  <span className="ml-2 text-[10px] tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
                    {t.priceRange}
                  </span>
                )}
              </p>
              {t.note && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2 leading-relaxed">
                  {t.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

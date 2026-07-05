import Section from '../Section'
import { WEDDING } from '../../config'

export default function Travel() {
  const { hotels } = WEDDING

  return (
    <Section id="travel" label="Travel">
      {hotels.length === 0 ? (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-600">
          Hotel block details coming soon.
        </p>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          {hotels.map((hotel) => (
            <div
              key={hotel.name}
              className="border border-zinc-100 dark:border-zinc-900 rounded-[2px] p-7 text-center"
            >
              <p className="text-base font-[300] text-zinc-900 dark:text-zinc-50 mb-1">
                {hotel.name}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                {hotel.address}
              </p>
              {hotel.note && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-4">
                  {hotel.note}
                </p>
              )}
              {hotel.bookingUrl && (
                <a
                  href={hotel.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-150"
                >
                  Book Now ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

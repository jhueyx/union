import Section from '../Section'
import { WEDDING } from '../../config'

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-2">
        {label}
      </p>
      <p className="text-lg font-[300] text-zinc-900 dark:text-zinc-50">
        {value || '—'}
      </p>
    </div>
  )
}

export default function Details() {
  const { date, venue, dressCode } = WEDDING

  return (
    <Section id="details" label="Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
        <DataPoint label="Date" value={date} />
        <DataPoint label="Venue" value={venue.name} />
        <DataPoint label="Dress Code" value={dressCode} />
      </div>

      {venue.address && (
        <div className="mt-14 text-center space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{venue.address}</p>
          {venue.mapsUrl && (
            <a
              href={venue.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-150"
            >
              View Map ↗
            </a>
          )}
        </div>
      )}
    </Section>
  )
}

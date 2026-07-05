import Section from '../Section'
import { WEDDING } from '../../config'

export default function Schedule() {
  const { schedule } = WEDDING

  return (
    <Section id="schedule" label="Schedule">
      {schedule.length === 0 ? (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-600">
          Details coming soon.
        </p>
      ) : (
        <dl className="max-w-xs mx-auto space-y-7">
          {schedule.map(({ time, event, note }) => (
            <div key={`${time}-${event}`} className="flex items-start gap-8">
              <dt className="w-16 shrink-0 text-xs tracking-[0.08em] tabular-nums text-zinc-400 dark:text-zinc-600 pt-0.5">
                {time}
              </dt>
              <dd>
                <p className="text-sm font-[400] text-zinc-900 dark:text-zinc-50">
                  {event}
                </p>
                {note && (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">{note}</p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  )
}

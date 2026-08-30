// Day-of timeline — the running order for the wedding day.
import { useEffect, useMemo, useState } from 'react'
import { fetchAll, insertRow, deleteRow, type TimelineEvent } from '../../lib/planning'
import { PageHeader, Panel, TextInput, Btn, Empty } from '../../components/admin/AdminUI'

/** "14:30:00" -> "2:30 PM". Times are stored as a bare time, not a timestamp:
 *  the running order is relative to the day, not to a timezone. */
function fmt(t: string | null) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [owner, setOwner] = useState('')

  async function load() {
    const rows = await fetchAll<TimelineEvent>('wedding_timeline')
    // Sort by time, with unscheduled items last rather than first.
    rows.sort((a, b) => (a.starts_at ?? '99').localeCompare(b.starts_at ?? '99'))
    setEvents(rows); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totalScheduled = useMemo(() => events.filter(e => e.starts_at).length, [events])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const row = await insertRow<TimelineEvent>('wedding_timeline', {
      title: title.trim(),
      starts_at: time || null,
      location: location.trim() || null,
      owner: owner.trim() || null,
    }, 'add timeline event')
    if (row) { setTitle(''); setTime(''); setLocation(''); setOwner(''); load() }
  }

  if (loading) return <div className="max-w-[1000px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <PageHeader
        title="Timeline"
        action={
          <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">
            {totalScheduled} of {events.length} scheduled
          </span>
        }
      />

      <form onSubmit={add} className="flex flex-wrap gap-2 mb-8">
        <TextInput type="time" value={time} onChange={e => setTime(e.target.value)} />
        <TextInput placeholder="What happens…" value={title} onChange={e => setTitle(e.target.value)} className="flex-1 min-w-[200px]" />
        <TextInput placeholder="Where" value={location} onChange={e => setLocation(e.target.value)} />
        <TextInput placeholder="Who runs it" value={owner} onChange={e => setOwner(e.target.value)} />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>

      {events.length === 0 ? <Empty>No events yet.</Empty> : (
        <Panel className="!p-0">
          <ul>
            {events.map(ev => (
              <li key={ev.id} className="flex items-baseline gap-4 px-5 py-4 border-b border-zinc-900 last:border-0">
                <span className="w-20 shrink-0 text-sm tabular-nums text-zinc-400">{fmt(ev.starts_at)}</span>
                <span className="flex-1">
                  <span className="text-sm text-zinc-200">{ev.title}</span>
                  {(ev.location || ev.owner) && (
                    <span className="block text-[10px] tracking-[0.15em] uppercase text-zinc-500 mt-1">
                      {[ev.location, ev.owner].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
                <button
                  onClick={async () => { if (await deleteRow('wedding_timeline', ev.id, 'delete event')) load() }}
                  className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

// Union — planner home.
//
// This used to duplicate the Guests page (household list, add/delete guest)
// and report nothing the other pages didn't already show. Guests already owns
// that job. This page's job is different: pull one number from each module —
// checklist, budget, seats, RSVPs — and put them next to each other, because
// none of those pages can see the others. "16 seats over capacity" and "$182
// per head" are only visible from here.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAll, fetchSettings, money, SIDE_LABEL, hasAddress,
  daysUntil, relativeDay, formatDay, toISODay, today as todayDate, shiftDay,
  type Household, type Guest, type RsvpResponse, type WeddingTask,
  type BudgetItem, type WeddingTable, type SeatAssignment, type WeddingSettings,
} from '../../lib/planning'
import { PageHeader, Panel, Label, Stat, Empty } from '../../components/admin/AdminUI'

export default function Dashboard() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [households, setHouseholds] = useState<Household[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([])
  const [tasks, setTasks] = useState<WeddingTask[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [tables, setTables] = useState<WeddingTable[]>([])
  const [seats, setSeats] = useState<SeatAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchAll<Household>('households'),
      fetchAll<Guest>('guests'),
      fetchAll<RsvpResponse>('rsvp_responses'),
      fetchAll<WeddingTask>('wedding_tasks'),
      fetchAll<BudgetItem>('wedding_budget'),
      fetchAll<WeddingTable>('wedding_tables'),
      fetchAll<SeatAssignment>('wedding_seat_assignments'),
    ]).then(([se, h, g, r, t, b, tb, sa]) => {
      setSettings(se); setHouseholds(h); setGuests(g); setRsvps(r)
      setTasks(t); setBudget(b); setTables(tb); setSeats(sa)
      setLoading(false)
    })
  }, [])

  const iso = toISODay(todayDate())
  const date = settings?.wedding_date ?? null

  // ── Guests & RSVPs ──
  const seatsAllotted = households.reduce((n, h) => n + (h.max_guests || 0), 0)
  const named = guests.length
  const attending = rsvps.filter(r => r.attending === true).length
  const declined = rsvps.filter(r => r.attending === false).length
  const responded = rsvps.filter(r => r.guest_id && r.attending !== null).length
  const responseRate = named > 0 ? Math.round((responded / named) * 100) : 0

  const bySide = useMemo(() => {
    const acc: Record<'bride' | 'groom' | 'both' | 'unassigned', number> = { bride: 0, groom: 0, both: 0, unassigned: 0 }
    for (const h of households) acc[h.side ?? 'unassigned'] += h.max_guests || 0
    return acc
  }, [households])

  // ── Checklist ──
  const openTasks = tasks.filter(t => !t.done)
  const overdue = openTasks.filter(t => t.due_date && t.due_date < iso)
  const dueSoon = openTasks
    .filter(t => t.due_date && t.due_date >= iso && t.due_date <= shiftDay(iso, 30))
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))

  // ── Budget ──
  const budgetTotals = useMemo(() => {
    let est = 0, act = 0, paid = 0
    for (const i of budget) {
      est += Number(i.estimated) || 0
      const a = Number(i.actual) || 0
      act += a
      if (i.paid) paid += a
    }
    return { est, act, paid, outstanding: act - paid }
  }, [budget])
  const spent = budgetTotals.act || budgetTotals.est
  const perHead = seatsAllotted > 0 ? spent / seatsAllotted : 0

  // ── Seating ──
  const capacity = tables.reduce((n, t) => n + (t.capacity || 0), 0)
  const seatedCount = seats.length
  const overCapacity = capacity > 0 && seatsAllotted > capacity

  // ── Addresses ──
  const addressed = households.filter(hasAddress).length
  const sent = households.filter(h => h.invitation_sent_at).length

  // ── RSVP extras ── Free text nobody else on the site surfaces: Guests shows
  // only a "dietary" tag, and song requests / guest notes have nowhere else to
  // land.
  const nameOf = useMemo(() => new Map(guests.map(g => [g.id, `${g.first_name} ${g.last_name}`.trim()])), [guests])
  const songRequests = rsvps.filter(r => r.guest_id && r.song_request?.trim())
  const rsvpNotes = rsvps.filter(r => r.guest_id && r.notes?.trim())

  if (loading) return <div className="max-w-[1100px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12 space-y-8">
      <PageHeader
        title="Union"
        action={
          date ? (
            <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">
              {formatDay(date)} · {relativeDay(date)}
            </span>
          ) : (
            <Link to="/admin/settings" className="text-[10px] tracking-[0.15em] uppercase text-amber-400 hover:text-amber-300">
              Set the wedding date →
            </Link>
          )
        }
      />

      {/* ── The day ── */}
      {date && (
        <Panel className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <p className="text-4xl font-[300] tabular-nums text-zinc-50">
              {Math.max(0, daysUntil(date))}
            </p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-1">
              {daysUntil(date) >= 0 ? 'days to go' : `${relativeDay(date)}`}
            </p>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-xl font-[300] tabular-nums text-zinc-50">{responseRate}%</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">responded</p>
            </div>
            <div className="text-right">
              <p className={'text-xl font-[300] tabular-nums ' + (overdue.length ? 'text-rose-400' : 'text-zinc-50')}>
                {overdue.length}
              </p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">overdue tasks</p>
            </div>
          </div>
        </Panel>
      )}

      {/* ── Numbers only this page can compare ── */}
      <div>
        <Label>At a glance</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Seats allotted" value={seatsAllotted} />
          <Stat
            label="Table capacity"
            value={capacity || '—'}
            accent={overCapacity ? 'text-rose-400' : undefined}
          />
          <Stat label="Attending" value={attending} accent="text-emerald-400" />
          <Stat label="Declined" value={declined} accent="text-rose-400" />
          <Stat label="Cost per head" value={perHead > 0 ? money(perHead) : '—'} />
          <Stat
            label="Budget outstanding"
            value={budgetTotals.outstanding > 0 ? money(budgetTotals.outstanding) : '—'}
            accent={budgetTotals.outstanding > 0 ? 'text-amber-400' : undefined}
          />
          <Stat label="Addressed" value={`${addressed}/${households.length}`} />
          <Stat label="Invitations sent" value={`${sent}/${households.length}`} />
        </div>
        {overCapacity && (
          <p className="text-[10px] tracking-[0.15em] uppercase text-rose-400 mt-3">
            {seatsAllotted - capacity} more {seatsAllotted - capacity === 1 ? 'seat is' : 'seats are'} allotted
            than the floor plan holds — add table capacity or trim the list.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Song requests & notes ── The only place these surface; Guests
            shows just a "dietary" tag. */}
        {(songRequests.length > 0 || rsvpNotes.length > 0) && (
          <Panel className="md:col-span-2">
            <div className="flex items-baseline justify-between mb-4">
              <Label>From RSVPs</Label>
              <Link to="/admin/guests" className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300">
                Guests →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">Song requests</p>
                {songRequests.length === 0 ? (
                  <p className="text-sm text-zinc-600">None yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {songRequests.map((r, i) => (
                      <li key={i} className="text-sm text-zinc-300">
                        {r.song_request}
                        <span className="text-zinc-600"> — {nameOf.get(r.guest_id!) ?? 'Guest'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">Notes</p>
                {rsvpNotes.length === 0 ? (
                  <p className="text-sm text-zinc-600">None yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {rsvpNotes.map((r, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-zinc-300 italic">"{r.notes}"</span>
                        <span className="text-zinc-600"> — {nameOf.get(r.guest_id!) ?? 'Guest'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        )}

        {/* ── Checklist ── */}
        <Panel>
          <div className="flex items-baseline justify-between mb-4">
            <Label>Coming up</Label>
            <Link to="/admin/checklist" className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300">
              Checklist →
            </Link>
          </div>
          {overdue.length === 0 && dueSoon.length === 0 ? (
            <p className="text-sm text-zinc-600">
              {tasks.length === 0 ? 'No tasks yet.' : 'Nothing due in the next 30 days.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {[...overdue, ...dueSoon].slice(0, 6).map(t => (
                <li key={t.id} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-zinc-300 truncate">{t.title}</span>
                  <span className={'text-[10px] tracking-[0.15em] uppercase whitespace-nowrap ' +
                    (t.due_date && t.due_date < iso ? 'text-rose-400' : 'text-zinc-500')}>
                    {t.due_date ? relativeDay(t.due_date) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* ── Seats by side ── */}
        <Panel>
          <div className="flex items-baseline justify-between mb-4">
            <Label>Seats by side</Label>
            <Link to="/admin/guests" className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300">
              Guests →
            </Link>
          </div>
          <ul className="space-y-2">
            {(['bride', 'groom', 'both', 'unassigned'] as const).map(key => (
              <li key={key} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{key === 'unassigned' ? 'Unassigned' : SIDE_LABEL[key]}</span>
                <span className="tabular-nums text-zinc-50">{bySide[key]}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* ── Budget ── */}
        <Panel>
          <div className="flex items-baseline justify-between mb-4">
            <Label>Budget</Label>
            <Link to="/admin/budget" className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300">
              Budget →
            </Link>
          </div>
          {budget.length === 0 ? (
            <p className="text-sm text-zinc-600">No budget items yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-zinc-300">Estimated</span>
                <span className="tabular-nums text-zinc-50">{money(budgetTotals.est)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-300">Actual</span>
                <span className="tabular-nums text-zinc-50">{money(budgetTotals.act)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-300">Paid</span>
                <span className="tabular-nums text-zinc-50">{money(budgetTotals.paid)}</span>
              </li>
            </ul>
          )}
        </Panel>

        {/* ── Seating ── */}
        <Panel>
          <div className="flex items-baseline justify-between mb-4">
            <Label>Seating</Label>
            <Link to="/admin/seating" className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300">
              Seating →
            </Link>
          </div>
          {tables.length === 0 ? (
            <p className="text-sm text-zinc-600">No tables yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-zinc-300">Tables</span>
                <span className="tabular-nums text-zinc-50">{tables.length}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-300">Capacity</span>
                <span className="tabular-nums text-zinc-50">{capacity}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-300">Seated</span>
                <span className="tabular-nums text-zinc-50">{seatedCount}</span>
              </li>
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

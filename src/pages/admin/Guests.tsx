// Guest list — households, their guests, and RSVP state in one place.
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll, insertRow, updateRow, deleteRow,
  type Guest, type Household, type RsvpResponse,
} from '../../lib/planning'
import { PageHeader, Panel, TextInput, Btn, Empty, Stat } from '../../components/admin/AdminUI'

type Rsvp = RsvpResponse

export default function Guests() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newHousehold, setNewHousehold] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newGuest, setNewGuest] = useState('')

  async function load() {
    const [h, g, r] = await Promise.all([
      fetchAll<Household>('households', 'name'),
      fetchAll<Guest>('guests', 'last_name'),
      fetchAll<Rsvp>('rsvp_responses'),
    ])
    setHouseholds(h); setGuests(g); setRsvps(r); setLoading(false)
  }
  useEffect(() => { load() }, [])

  // guest_id -> their response. A household-level row (guest_id null) is the
  // "no one is coming" case and is not attached to an individual.
  const rsvpByGuest = useMemo(() => {
    const m = new Map<string, Rsvp>()
    for (const r of rsvps) if (r.guest_id) m.set(r.guest_id, r)
    return m
  }, [rsvps])

  const guestsByHousehold = useMemo(() => {
    const m = new Map<string, Guest[]>()
    for (const g of guests) {
      const list = m.get(g.household_id) ?? []
      list.push(g); m.set(g.household_id, list)
    }
    return m
  }, [guests])

  const stats = useMemo(() => {
    let attending = 0, declined = 0
    for (const g of guests) {
      const r = rsvpByGuest.get(g.id)
      if (r?.attending === true) attending++
      else if (r?.attending === false) declined++
    }
    return { invited: guests.length, attending, declined, pending: guests.length - attending - declined }
  }, [guests, rsvpByGuest])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return households
    return households.filter(h => {
      if (h.name.toLowerCase().includes(q) || h.invite_code.toLowerCase().includes(q)) return true
      return (guestsByHousehold.get(h.id) ?? []).some(g =>
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(q))
    })
  }, [households, search, guestsByHousehold])

  async function addHousehold(e: React.FormEvent) {
    e.preventDefault()
    const name = newHousehold.trim()
    if (!name) return
    // A short, unambiguous code: no O/0/I/1 so it can be read aloud or typed
    // off a printed invitation without confusion.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
    const row = await insertRow<Household>('households', { name, invite_code: code, max_guests: 2 }, 'add household')
    if (row) { setNewHousehold(''); load() }
  }

  async function addGuest(householdId: string) {
    const parts = newGuest.trim().split(/\s+/)
    if (!parts[0]) return
    const row = await insertRow<Guest>('guests', {
      household_id: householdId,
      first_name: parts[0],
      last_name: parts.slice(1).join(' ') || '',
    }, 'add guest')
    if (row) { setNewGuest(''); setAddingTo(null); load() }
  }

  async function removeGuest(id: string) {
    if (await deleteRow('guests', id, 'remove guest')) load()
  }

  async function setMaxGuests(h: Household, n: number) {
    if (await updateRow('households', h.id, { max_guests: n }, 'update household')) load()
  }

  if (loading) return <div className="max-w-[1200px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <PageHeader title="Guests" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Invited" value={stats.invited} />
        <Stat label="Attending" value={stats.attending} accent="text-emerald-400" />
        <Stat label="Declined" value={stats.declined} accent="text-rose-400" />
        <Stat label="Pending" value={stats.pending} accent="text-amber-400" />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <TextInput
          placeholder="Search name, household, or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <form onSubmit={addHousehold} className="flex gap-2">
          <TextInput
            placeholder="New household…"
            value={newHousehold}
            onChange={e => setNewHousehold(e.target.value)}
          />
          <Btn variant="primary" type="submit">Add</Btn>
        </form>
      </div>

      {visible.length === 0 ? (
        <Empty>{search ? 'No matches.' : 'No households yet.'}</Empty>
      ) : (
        <div className="space-y-3">
          {visible.map(h => {
            const list = guestsByHousehold.get(h.id) ?? []
            return (
              <Panel key={h.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm text-zinc-50">{h.name}</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-1">
                      Code {h.invite_code} · {list.length} of {h.max_guests} seats
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">Max</span>
                    <TextInput
                      type="number"
                      min={1}
                      max={20}
                      value={h.max_guests}
                      onChange={e => setMaxGuests(h, Number(e.target.value) || 1)}
                      className="w-16"
                    />
                  </div>
                </div>

                {list.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {list.map(g => {
                      const r = rsvpByGuest.get(g.id)
                      const state = r?.attending === true ? ['Attending', 'text-emerald-400']
                        : r?.attending === false ? ['Declined', 'text-rose-400']
                        : ['Pending', 'text-amber-400']
                      return (
                        <li key={g.id} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0">
                          <span className="text-sm text-zinc-300">{g.first_name} {g.last_name}</span>
                          <span className="flex items-center gap-4">
                            {r?.dietary_restrictions && (
                              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500" title={r.dietary_restrictions}>
                                dietary
                              </span>
                            )}
                            <span className={`text-[10px] tracking-[0.15em] uppercase ${state[1]}`}>{state[0]}</span>
                            <button
                              onClick={() => removeGuest(g.id)}
                              className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                            >
                              Remove
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {addingTo === h.id ? (
                  <form
                    onSubmit={e => { e.preventDefault(); addGuest(h.id) }}
                    className="flex gap-2"
                  >
                    <TextInput
                      autoFocus
                      placeholder="First Last"
                      value={newGuest}
                      onChange={e => setNewGuest(e.target.value)}
                      onBlur={() => { if (!newGuest.trim()) setAddingTo(null) }}
                      className="flex-1"
                    />
                    <Btn variant="primary" type="submit">Save</Btn>
                  </form>
                ) : (
                  <Btn onClick={() => { setNewGuest(''); setAddingTo(h.id) }}>+ Add guest</Btn>
                )}
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Guest list — households, their guests, and RSVP state in one place.
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll, insertRow, updateRow, deleteRow, generateInviteCode,
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
  const [view, setView] = useState<'all' | 'draft' | 'invited'>('all')
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

  const counts = useMemo(() => ({
    all: households.length,
    draft: households.filter(h => !h.invite_code).length,
    invited: households.filter(h => h.invite_code).length,
  }), [households])

  const stats = useMemo(() => {
    let attending = 0, declined = 0
    for (const g of guests) {
      const r = rsvpByGuest.get(g.id)
      if (r?.attending === true) attending++
      else if (r?.attending === false) declined++
    }
    // Seats allotted is the sum of each household's max_guests — the number you
    // have actually committed to, which runs ahead of named guests while the
    // list is being built ("the Chens, plus one" is 2 seats but 1 name so far).
    // It is the figure to check against venue capacity, not the guest count.
    const allotted = households.reduce((n, h) => n + (h.max_guests || 0), 0)
    return {
      households: households.length,
      allotted,
      named: guests.length,
      unnamed: Math.max(0, allotted - guests.length),
      attending,
      declined,
      pending: guests.length - attending - declined,
    }
  }, [guests, rsvpByGuest, households])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const scoped = view === 'all' ? households
      : view === 'draft' ? households.filter(h => !h.invite_code)
      : households.filter(h => h.invite_code)
    if (!q) return scoped
    return scoped.filter(h => {
      if (h.name.toLowerCase().includes(q)) return true
      if (h.invite_code?.toLowerCase().includes(q)) return true
      return (guestsByHousehold.get(h.id) ?? []).some(g =>
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(q))
    })
  }, [households, search, guestsByHousehold, view])

  /**
   * New households start with no invite code. Building the list is a different
   * act from deciding to invite someone, and a code implies the second.
   */
  async function addHousehold(e: React.FormEvent) {
    e.preventDefault()
    const name = newHousehold.trim()
    if (!name) return
    const row = await insertRow<Household>('households',
      { name, invite_code: null, max_guests: 2 }, 'add household')
    if (row) { setNewHousehold(''); load() }
  }

  async function renameHousehold(h: Household, raw: string) {
    const name = raw.trim()
    // An empty name would make the row unidentifiable; treat it as a no-op and
    // let load() put the previous value back in the field.
    if (!name || name === h.name) { if (!name) load(); return }
    if (await updateRow('households', h.id, { name }, 'rename household')) load()
  }

  /** Mint a code when the invitation is actually going out. */
  async function issueCode(h: Household) {
    if (await updateRow('households', h.id, { invite_code: generateInviteCode() }, 'generate invite code')) load()
  }

  /**
   * Accepts several names at once, comma separated ("Ann Lee, Bo Chen"), because
   * building the list is the bulk phase — one name per round trip through the
   * form makes entering forty households tedious enough to avoid.
   */
  async function addGuest(householdId: string) {
    const names = newGuest.split(',').map(n => n.trim()).filter(Boolean)
    if (names.length === 0) return
    let added = 0
    for (const full of names) {
      const parts = full.split(/\s+/)
      const row = await insertRow<Guest>('guests', {
        household_id: householdId,
        first_name: parts[0],
        last_name: parts.slice(1).join(' ') || '',
      }, 'add guest')
      if (row) added++
    }
    if (added) { setNewGuest(''); setAddingTo(null); load() }
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Stat label="Households" value={stats.households} />
        <Stat label="Seats allotted" value={stats.allotted} />
        <Stat label="Named" value={stats.named} />
        <Stat label="Attending" value={stats.attending} accent="text-emerald-400" />
        <Stat label="Declined" value={stats.declined} accent="text-rose-400" />
        <Stat label="Pending" value={stats.pending} accent="text-amber-400" />
      </div>

      {stats.unnamed > 0 && (
        <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-10">
          {stats.unnamed} allotted {stats.unnamed === 1 ? 'seat has' : 'seats have'} no name yet
        </p>
      )}
      {stats.unnamed === 0 && <div className="mb-10" />}

      <div className="flex flex-wrap gap-3 mb-4">
        <TextInput
          placeholder="Search name, household, or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <form onSubmit={addHousehold} className="flex gap-2">
          <TextInput
            placeholder="Add household…"
            value={newHousehold}
            onChange={e => setNewHousehold(e.target.value)}
          />
          <Btn variant="primary" type="submit">Add</Btn>
        </form>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          ['all', 'All', counts.all],
          ['draft', 'Not invited', counts.draft],
          ['invited', 'Invited', counts.invited],
        ] as const).map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={
              'text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-[2px] border transition-colors ' +
              (view === key
                ? 'border-zinc-500 text-zinc-50'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300')
            }
          >
            {label} {n}
          </button>
        ))}
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
                    {/* Click-to-edit rather than a separate edit mode: the name is
                        the field most likely to need a fix (a typo, a surname
                        added later), and a mode toggle for one input is friction. */}
                    <input
                      defaultValue={h.name}
                      onBlur={e => renameHousehold(h, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') {
                          (e.target as HTMLInputElement).value = h.name
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                      aria-label="Household name"
                      className="text-sm text-zinc-50 bg-transparent border border-transparent rounded-[2px] -mx-2 px-2 py-0.5 w-full max-w-[320px] hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-1">
                      {h.invite_code
                        ? <>Code {h.invite_code}</>
                        : <span className="text-zinc-600">Not invited yet</span>}
                      {' · '}{list.length} of {h.max_guests} seats
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!h.invite_code && (
                      <Btn onClick={() => issueCode(h)}>Generate code</Btn>
                    )}
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
                      placeholder="First Last, or several separated by commas"
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

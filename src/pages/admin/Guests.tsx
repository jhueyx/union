// Guest list — households, their guests, and RSVP state in one place.
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll, insertRow, updateRow, deleteRow, generateInviteCode, SIDE_LABEL,
  hasAddress, addressLines,
  type Guest, type Household, type RsvpResponse, type Side,
} from '../../lib/planning'
import { PageHeader, Panel, Label, TextInput, Select, Btn, Empty, Stat } from '../../components/admin/AdminUI'

/** Side filter values — the three real sides plus households not yet assigned. */
type SideFilter = 'all' | Side | 'unassigned'

const SIDE_OPTIONS: Side[] = ['bride', 'groom', 'both']

type Rsvp = RsvpResponse

export default function Guests() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newHousehold, setNewHousehold] = useState('')
  // Sticky between adds: households arrive in family batches, so the side you
  // just picked is almost always the side of the next one.
  const [newSide, setNewSide] = useState<Side | ''>('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [view, setView] = useState<'all' | 'draft' | 'invited'>('all')
  const [sideView, setSideView] = useState<SideFilter>('all')
  const [newGuest, setNewGuest] = useState('')
  const [newGuestIsChild, setNewGuestIsChild] = useState(false)
  const [editingAddress, setEditingAddress] = useState<string | null>(null)

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

  const sideCounts = useMemo(() => {
    const n: Record<SideFilter, number> = { all: households.length, bride: 0, groom: 0, both: 0, unassigned: 0 }
    for (const h of households) n[h.side ?? 'unassigned']++
    return n
  }, [households])

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
      children: guests.filter(g => g.is_child).length,
      adults: guests.filter(g => !g.is_child).length,
      addressed: households.filter(hasAddress).length,
      sent: households.filter(h => h.invitation_sent_at).length,
    }
  }, [guests, rsvpByGuest, households])

  /**
   * Seats and names per side. Seats are the figure the two families compare —
   * they are what has actually been committed — while names lag behind while
   * the list is still being built.
   */
  const bySide = useMemo(() => {
    const blank = () => ({ seats: 0, named: 0, children: 0 })
    const acc: Record<SideFilter, ReturnType<typeof blank>> = {
      all: blank(), bride: blank(), groom: blank(), both: blank(), unassigned: blank(),
    }
    const sideOf = new Map<string, SideFilter>()
    for (const h of households) {
      const key: SideFilter = h.side ?? 'unassigned'
      sideOf.set(h.id, key)
      acc[key].seats += h.max_guests || 0
    }
    for (const g of guests) {
      const key = sideOf.get(g.household_id)
      if (!key) continue
      acc[key].named++
      if (g.is_child) acc[key].children++
    }
    return acc
  }, [households, guests])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const byInvite = view === 'all' ? households
      : view === 'draft' ? households.filter(h => !h.invite_code)
      : households.filter(h => h.invite_code)
    const scoped = sideView === 'all' ? byInvite
      : byInvite.filter(h => (h.side ?? 'unassigned') === sideView)
    if (!q) return scoped
    return scoped.filter(h => {
      if (h.name.toLowerCase().includes(q)) return true
      if (h.invite_code?.toLowerCase().includes(q)) return true
      return (guestsByHousehold.get(h.id) ?? []).some(g =>
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(q))
    })
  }, [households, search, guestsByHousehold, view, sideView])

  /**
   * New households start with no invite code. Building the list is a different
   * act from deciding to invite someone, and a code implies the second.
   */
  async function addHousehold(e: React.FormEvent) {
    e.preventDefault()
    const name = newHousehold.trim()
    if (!name) return
    const row = await insertRow<Household>('households',
      { name, invite_code: null, max_guests: 2, side: newSide || null }, 'add household')
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
        // Applies to the whole batch — children usually get entered together.
        is_child: newGuestIsChild,
      }, 'add guest')
      if (row) added++
    }
    if (added) { setNewGuest(''); setNewGuestIsChild(false); setAddingTo(null); load() }
  }

  async function removeGuest(id: string) {
    if (await deleteRow('guests', id, 'remove guest')) load()
  }

  /** Cascades to the household's guests, RSVPs, and seat assignments. */
  async function removeHousehold(id: string) {
    if (await deleteRow('households', id, 'remove household')) load()
  }

  async function setMaxGuests(h: Household, n: number) {
    if (await updateRow('households', h.id, { max_guests: n }, 'update household')) load()
  }

  /** Empty string from the select means undecided, which is stored as null. */
  async function setSide(h: Household, value: string) {
    const side = (value || null) as Side | null
    if (await updateRow('households', h.id, { side }, 'set side')) load()
  }

  async function toggleChild(g: Guest) {
    if (await updateRow('guests', g.id, { is_child: !g.is_child }, 'update guest')) load()
  }

  async function saveAddress(h: Household, patch: Record<string, string>) {
    const clean: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(patch)) clean[k] = v.trim() || null
    if (await updateRow('households', h.id, clean, 'save address')) {
      setEditingAddress(null); load()
    }
  }

  /** Records that the invitation went out — a separate fact from having a code. */
  async function toggleSent(h: Household) {
    const invitation_sent_at = h.invitation_sent_at ? null : new Date().toISOString()
    if (await updateRow('households', h.id, { invitation_sent_at }, 'update household')) load()
  }

  if (loading) return <div className="max-w-[1200px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <PageHeader title="Guests" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <Stat label="Households" value={stats.households} />
        <Stat label="Seats allotted" value={stats.allotted} />
        <Stat label="Adults" value={stats.adults} />
        <Stat label="Children" value={stats.children} />
        <Stat label="Addressed" value={`${stats.addressed}/${stats.households}`} />
        <Stat label="Invitations sent" value={`${stats.sent}/${stats.households}`} />
        <Stat label="Attending" value={stats.attending} accent="text-emerald-400" />
        <Stat label="Declined" value={stats.declined} accent="text-rose-400" />
        <Stat label="Pending" value={stats.pending} accent="text-amber-400" />
      </div>

      {/* Seats per side — the figure the two families actually compare. */}
      <Panel className="mb-4">
        <Label>By side</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['bride', 'groom', 'both', 'unassigned'] as const).map(key => {
            const row = bySide[key]
            return (
              <div key={key}>
                <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-1">
                  {key === 'unassigned' ? 'Unassigned' : SIDE_LABEL[key]}
                </p>
                <p className="text-2xl font-[300] tabular-nums text-zinc-50">{row.seats}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 mt-1">
                  {row.named} named{row.children > 0 && ` · ${row.children} child${row.children === 1 ? '' : 'ren'}`}
                </p>
              </div>
            )
          })}
        </div>
      </Panel>

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
          <Select
            value={newSide}
            onChange={e => setNewSide(e.target.value as Side | '')}
            aria-label="Side for new household"
          >
            <option value="">Side —</option>
            {SIDE_OPTIONS.map(o => (
              <option key={o} value={o}>{SIDE_LABEL[o]}</option>
            ))}
          </Select>
          <Btn variant="primary" type="submit">Add</Btn>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
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

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          ['all', 'Any side'],
          ['bride', SIDE_LABEL.bride],
          ['groom', SIDE_LABEL.groom],
          ['both', SIDE_LABEL.both],
          ['unassigned', 'Unassigned'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSideView(key)}
            className={
              'text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-[2px] border transition-colors ' +
              (sideView === key
                ? 'border-zinc-500 text-zinc-50'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300')
            }
          >
            {label} {sideCounts[key]}
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
                      {' · '}
                      {h.side
                        ? SIDE_LABEL[h.side]
                        : <span className="text-zinc-600">No side</span>}
                      {' · '}{list.length} of {h.max_guests} seats
                      {h.invitation_sent_at && <span className="text-emerald-400"> · Sent</span>}
                      {!hasAddress(h) && <span className="text-zinc-600"> · No address</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!h.invite_code && (
                      <Btn onClick={() => issueCode(h)}>Generate code</Btn>
                    )}
                    <Select
                      value={h.side ?? ''}
                      onChange={e => setSide(h, e.target.value)}
                      aria-label="Side"
                      className="py-1.5"
                    >
                      <option value="">Side —</option>
                      {SIDE_OPTIONS.map(o => (
                        <option key={o} value={o}>{SIDE_LABEL[o]}</option>
                      ))}
                    </Select>
                    <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">Max</span>
                    <TextInput
                      type="number"
                      min={1}
                      max={20}
                      value={h.max_guests}
                      onChange={e => setMaxGuests(h, Number(e.target.value) || 1)}
                      className="w-16"
                    />
                    <button
                      onClick={() => removeHousehold(h.id)}
                      className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                    >
                      Remove
                    </button>
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
                            {/* Lit means child, dim means adult — a toggle rather
                                than a checkbox, so the row stays a single line
                                and reads as a badge when it is on. */}
                            <button
                              onClick={() => toggleChild(g)}
                              aria-pressed={g.is_child}
                              title={g.is_child ? 'Mark as adult' : 'Mark as child'}
                              className={
                                'text-[10px] tracking-[0.15em] uppercase transition-colors ' +
                                (g.is_child
                                  ? 'text-zinc-200'
                                  : 'text-zinc-700 hover:text-zinc-500')
                              }
                            >
                              Child
                            </button>
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

                {editingAddress === h.id ? (
                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      const f = new FormData(e.currentTarget)
                      saveAddress(h, {
                        address_line1: String(f.get('address_line1') ?? ''),
                        address_line2: String(f.get('address_line2') ?? ''),
                        city: String(f.get('city') ?? ''),
                        state: String(f.get('state') ?? ''),
                        postal_code: String(f.get('postal_code') ?? ''),
                        country: String(f.get('country') ?? ''),
                      })
                    }}
                    className="mb-3 space-y-2"
                  >
                    <TextInput autoFocus name="address_line1" defaultValue={h.address_line1 ?? ''} placeholder="Street address" className="w-full" />
                    <TextInput name="address_line2" defaultValue={h.address_line2 ?? ''} placeholder="Apartment, suite (optional)" className="w-full" />
                    <div className="flex flex-wrap gap-2">
                      <TextInput name="city" defaultValue={h.city ?? ''} placeholder="City" className="flex-1 min-w-[140px]" />
                      <TextInput name="state" defaultValue={h.state ?? ''} placeholder="State" className="w-24" />
                      <TextInput name="postal_code" defaultValue={h.postal_code ?? ''} placeholder="ZIP" className="w-28" />
                      <TextInput name="country" defaultValue={h.country ?? ''} placeholder="Country (if not US)" className="flex-1 min-w-[140px]" />
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="primary" type="submit">Save address</Btn>
                      <Btn type="button" onClick={() => setEditingAddress(null)}>Cancel</Btn>
                    </div>
                  </form>
                ) : hasAddress(h) ? (
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    {addressLines(h).join(' · ')}
                    <button
                      onClick={() => setEditingAddress(h.id)}
                      className="ml-3 text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      Edit
                    </button>
                  </p>
                ) : null}

                {addingTo === h.id ? (
                  <form
                    onSubmit={e => { e.preventDefault(); addGuest(h.id) }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <TextInput
                      autoFocus
                      placeholder="First Last, or several separated by commas"
                      value={newGuest}
                      onChange={e => setNewGuest(e.target.value)}
                      className="flex-1 min-w-[220px]"
                    />
                    <label className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-500 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={newGuestIsChild}
                        onChange={e => setNewGuestIsChild(e.target.checked)}
                      />
                      Children
                    </label>
                    <Btn variant="primary" type="submit">Save</Btn>
                    <Btn type="button" onClick={() => setAddingTo(null)}>Cancel</Btn>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Btn onClick={() => { setNewGuest(''); setNewGuestIsChild(false); setAddingTo(h.id) }}>+ Add guest</Btn>
                    {!hasAddress(h) && editingAddress !== h.id && (
                      <Btn onClick={() => setEditingAddress(h.id)}>+ Address</Btn>
                    )}
                    <Btn onClick={() => toggleSent(h)}>
                      {h.invitation_sent_at ? 'Mark not sent' : 'Mark invitation sent'}
                    </Btn>
                  </div>
                )}
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}

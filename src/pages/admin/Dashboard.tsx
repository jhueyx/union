// Union — admin dashboard with live Supabase data and guest management.
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MEAL_CHOICES } from '../../data/mock'
import { generateInviteCode } from '../../utils'
import type { Household, Guest } from '../../types'

type HouseholdWithGuests = Household & { guests: Guest[] }

type RsvpRow = {
  id: string
  household_id: string
  guest_id: string
  attending: boolean
  meal_choice_id: string | null
  dietary_restrictions: string | null
  song_request: string | null
  notes: string | null
  submitted_at: string
  guests: { first_name: string; last_name: string } | null
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
      <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">{label}</p>
      <p className={['text-3xl font-[300] tabular-nums', accent ?? 'text-zinc-50'].join(' ')}>
        {value}
      </p>
    </div>
  )
}

const BLANK_HOUSEHOLD = { name: '', invite_code: '', max_guests: 2, notes: '' }
const BLANK_GUEST = { first_name: '', last_name: '', email: '' }

export default function Dashboard() {
  const [households, setHouseholds] = useState<HouseholdWithGuests[]>([])
  const [rsvps, setRsvps] = useState<RsvpRow[]>([])
  const [loading, setLoading] = useState(true)

  // Add household form
  const [showAddHousehold, setShowAddHousehold] = useState(false)
  const [newHousehold, setNewHousehold] = useState(BLANK_HOUSEHOLD)
  const [savingHousehold, setSavingHousehold] = useState(false)

  // Add guest form — keyed by household id
  const [addingGuestTo, setAddingGuestTo] = useState<string | null>(null)
  const [newGuest, setNewGuest] = useState(BLANK_GUEST)
  const [savingGuest, setSavingGuest] = useState(false)

  async function fetchAll() {
    const [{ data: hh }, { data: rv }] = await Promise.all([
      supabase.from('households').select('*, guests(*)').order('created_at', { ascending: true }),
      supabase.from('rsvp_responses').select('*, guests(first_name, last_name)').order('submitted_at', { ascending: false }),
    ])
    setHouseholds((hh ?? []) as HouseholdWithGuests[])
    setRsvps((rv ?? []) as RsvpRow[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // ── Stats ──────────────────────────────────────────────────
  const totalInvited = households.reduce((sum, h) => sum + (h.guests?.length ?? 0), 0)
  const rsvpReceived = new Set(rsvps.map((r) => r.guest_id)).size
  const attending = rsvps.filter((r) => r.attending).length
  const notAttending = rsvps.filter((r) => !r.attending).length
  const pending = totalInvited - rsvpReceived
  const responseRate = totalInvited > 0 ? Math.round((rsvpReceived / totalInvited) * 100) : 0

  const mealCounts: Record<string, number> = {}
  for (const r of rsvps) {
    if (r.attending && r.meal_choice_id) {
      mealCounts[r.meal_choice_id] = (mealCounts[r.meal_choice_id] ?? 0) + 1
    }
  }
  const mealLabel = (id: string) => MEAL_CHOICES.find((m) => m.id === id)?.label ?? id

  const dietaryFlags = rsvps
    .filter((r) => r.dietary_restrictions?.trim())
    .map((r) => {
      const name = r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : 'Guest'
      return `${name}: ${r.dietary_restrictions}`
    })

  const songRequests = rsvps
    .filter((r) => r.song_request?.trim())
    .map((r) => ({
      song: r.song_request as string,
      guestName: r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : 'Guest',
    }))

  const guestNotes = rsvps
    .filter((r) => r.notes?.trim())
    .map((r) => ({
      note: r.notes as string,
      who: r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : 'Guest',
    }))

  // ── Mutations ──────────────────────────────────────────────
  async function addHousehold() {
    if (!newHousehold.name.trim() || !newHousehold.invite_code.trim()) return
    setSavingHousehold(true)
    await supabase.from('households').insert({
      name: newHousehold.name.trim(),
      invite_code: newHousehold.invite_code.trim().toUpperCase(),
      max_guests: newHousehold.max_guests,
      notes: newHousehold.notes.trim() || null,
    })
    setNewHousehold(BLANK_HOUSEHOLD)
    setShowAddHousehold(false)
    setSavingHousehold(false)
    await fetchAll()
  }

  async function deleteHousehold(id: string) {
    await supabase.from('households').delete().eq('id', id)
    await fetchAll()
  }

  async function addGuest(householdId: string) {
    if (!newGuest.first_name.trim() || !newGuest.last_name.trim()) return
    setSavingGuest(true)
    await supabase.from('guests').insert({
      household_id: householdId,
      first_name: newGuest.first_name.trim(),
      last_name: newGuest.last_name.trim(),
      email: newGuest.email.trim() || null,
    })
    setNewGuest(BLANK_GUEST)
    setAddingGuestTo(null)
    setSavingGuest(false)
    await fetchAll()
  }

  async function deleteGuest(id: string) {
    await supabase.from('guests').delete().eq('id', id)
    await fetchAll()
  }

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-600">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12 space-y-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-[300] tracking-[0.1em] text-zinc-50">Union — Admin</h1>
        <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-600">
          Last updated {new Date().toLocaleString('en-US')}
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Invited" value={totalInvited} />
        <StatCard label="RSVP'd" value={rsvpReceived} />
        <StatCard label="Attending" value={attending} accent="text-emerald-400" />
        <StatCard label="Not Attending" value={notAttending} accent="text-rose-400" />
        <StatCard label="Pending" value={pending} accent="text-amber-400" />
      </div>

      <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">Response Rate</p>
          <span className="text-sm tabular-nums text-zinc-300">{responseRate}%</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-50 rounded-full transition-all" style={{ width: `${responseRate}%` }} />
        </div>
      </div>

      {/* ── Guest List ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">Guest List</p>
          <button
            onClick={() => {
              setNewHousehold({ ...BLANK_HOUSEHOLD, invite_code: generateInviteCode() })
              setShowAddHousehold(true)
            }}
            className="text-[10px] tracking-[0.15em] uppercase text-zinc-400 hover:text-zinc-50 transition-colors"
          >
            + Add Household
          </button>
        </div>

        {/* Add household form */}
        {showAddHousehold && (
          <div className="border border-zinc-700 rounded-[2px] p-5 bg-zinc-900 mb-4 space-y-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">New Household</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-zinc-600 mb-1">Household Name</label>
                <input
                  value={newHousehold.name}
                  onChange={(e) => setNewHousehold((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. The Johnson Family"
                  className="w-full bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-zinc-600 mb-1">Invite Code</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={newHousehold.invite_code}
                    onChange={(e) => setNewHousehold((p) => ({ ...p, invite_code: e.target.value.toUpperCase() }))}
                    className="flex-1 bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setNewHousehold((p) => ({ ...p, invite_code: generateInviteCode() }))}
                    className="text-[10px] tracking-[0.1em] uppercase text-zinc-600 hover:text-zinc-400 whitespace-nowrap"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-zinc-600 mb-1">Max Guests</label>
                <input
                  type="number"
                  min={1}
                  value={newHousehold.max_guests}
                  onChange={(e) => setNewHousehold((p) => ({ ...p, max_guests: Number(e.target.value) }))}
                  className="w-full bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-zinc-600 mb-1">Notes (optional)</label>
                <input
                  value={newHousehold.notes}
                  onChange={(e) => setNewHousehold((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Wheelchair accessible seating needed"
                  className="w-full bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={addHousehold}
                disabled={savingHousehold}
                className="text-[10px] tracking-[0.15em] uppercase px-4 py-2 bg-zinc-50 text-zinc-900 rounded-[2px] hover:bg-white disabled:opacity-50"
              >
                {savingHousehold ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setShowAddHousehold(false)}
                className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {households.length === 0 && !showAddHousehold && (
          <p className="text-sm text-zinc-600">No households yet. Add one to get started.</p>
        )}

        <div className="space-y-3">
          {households.map((h) => (
            <div key={h.id} className="border border-zinc-800 rounded-[2px] bg-zinc-950">
              {/* Household header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <span className="text-sm text-zinc-100">{h.name}</span>
                  <span className="ml-3 text-[10px] tracking-[0.15em] uppercase text-zinc-600 font-mono">
                    {h.invite_code}
                  </span>
                  {h.notes && (
                    <span className="ml-2 text-xs text-zinc-600"> · {h.notes}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-600">
                    {h.guests?.length ?? 0}/{h.max_guests} guests
                  </span>
                  <button
                    onClick={() => { setAddingGuestTo(h.id); setNewGuest(BLANK_GUEST) }}
                    className="text-[10px] tracking-[0.1em] uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    + Guest
                  </button>
                  <button
                    onClick={() => deleteHousehold(h.id)}
                    className="text-[10px] tracking-[0.1em] uppercase text-zinc-700 hover:text-rose-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Guest rows */}
              {(h.guests ?? []).length > 0 && (
                <div className="border-t border-zinc-800 divide-y divide-zinc-900">
                  {h.guests!.map((g) => (
                    <div key={g.id} className="flex items-center justify-between px-5 py-2.5">
                      <span className="text-xs text-zinc-300">
                        {g.first_name} {g.last_name}
                        {g.email && <span className="text-zinc-600 ml-2">{g.email}</span>}
                      </span>
                      <button
                        onClick={() => deleteGuest(g.id)}
                        className="text-[10px] tracking-[0.1em] uppercase text-zinc-700 hover:text-rose-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add guest form */}
              {addingGuestTo === h.id && (
                <div className="border-t border-zinc-800 px-5 py-4 bg-zinc-900 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      autoFocus
                      value={newGuest.first_name}
                      onChange={(e) => setNewGuest((p) => ({ ...p, first_name: e.target.value }))}
                      placeholder="First name"
                      className="bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400"
                    />
                    <input
                      value={newGuest.last_name}
                      onChange={(e) => setNewGuest((p) => ({ ...p, last_name: e.target.value }))}
                      placeholder="Last name"
                      className="bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400"
                    />
                    <input
                      value={newGuest.email}
                      onChange={(e) => setNewGuest((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email (optional)"
                      type="email"
                      className="bg-transparent border-b border-zinc-700 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => addGuest(h.id)}
                      disabled={savingGuest}
                      className="text-[10px] tracking-[0.15em] uppercase px-4 py-2 bg-zinc-50 text-zinc-900 rounded-[2px] hover:bg-white disabled:opacity-50"
                    >
                      {savingGuest ? 'Adding…' : 'Add'}
                    </button>
                    <button
                      onClick={() => setAddingGuestTo(null)}
                      className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Meal & dietary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Meal Counts</p>
          {Object.keys(mealCounts).length === 0 ? (
            <p className="text-sm text-zinc-600">No meals selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(mealCounts).map(([id, count]) => (
                <li key={id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{mealLabel(id)}</span>
                  <span className="tabular-nums text-zinc-50">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Dietary Restrictions</p>
          {dietaryFlags.length === 0 ? (
            <p className="text-sm text-zinc-600">None reported.</p>
          ) : (
            <ul className="space-y-2">
              {dietaryFlags.map((flag, i) => (
                <li key={i} className="text-sm text-zinc-300">{flag}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Song Requests</p>
          {songRequests.length === 0 ? (
            <p className="text-sm text-zinc-600">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {songRequests.map((s, i) => (
                <li key={i} className="text-sm">
                  <span className="text-zinc-300">{s.song}</span>
                  <span className="text-zinc-600"> — {s.guestName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Guest Notes</p>
          {guestNotes.length === 0 ? (
            <p className="text-sm text-zinc-600">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {guestNotes.map((n, i) => (
                <li key={i} className="text-sm">
                  <span className="text-zinc-300 italic">"{n.note}"</span>
                  <span className="block text-[10px] tracking-[0.15em] uppercase text-zinc-600 mt-1">— {n.who}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── RSVP Responses ── */}
      {rsvps.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">RSVP Responses</p>
          <div className="border border-zinc-800 rounded-[2px] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] tracking-[0.15em] uppercase text-zinc-600">
                  <th className="text-left px-4 py-3 font-normal">Guest</th>
                  <th className="text-left px-4 py-3 font-normal">Status</th>
                  <th className="text-left px-4 py-3 font-normal hidden md:table-cell">Meal</th>
                  <th className="text-left px-4 py-3 font-normal hidden md:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {rsvps.map((r) => (
                  <tr key={r.id} className="bg-zinc-950">
                    <td className="px-4 py-3 text-zinc-200">
                      {r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={r.attending ? 'text-emerald-400' : 'text-rose-400'}>
                        {r.attending ? 'Attending' : 'Regrets'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                      {r.meal_choice_id ? mealLabel(r.meal_choice_id) : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 hidden md:table-cell">
                      {new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

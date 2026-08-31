// Gift tracker — red envelopes and other cash gifts, logged per household.
//
// household_id is nullable: a gift can arrive from someone not on the guest
// list (a business associate, a plus-one who came with someone else's
// invitation), so there's a free-text fallback rather than forcing a match.
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll, insertRow, deleteRow, money,
  type Household, type WeddingGift,
} from '../../lib/planning'
import { PageHeader, Panel, Label, TextInput, Select, Btn, Empty, Stat } from '../../components/admin/AdminUI'

const CURRENCIES = ['USD', 'CNY', 'HKD', 'TWD', 'CAD', 'Other']

export default function Gifts() {
  const [gifts, setGifts] = useState<WeddingGift[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)

  const [householdId, setHouseholdId] = useState('')
  const [givenBy, setGivenBy] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [receivedAt, setReceivedAt] = useState('')
  const [note, setNote] = useState('')

  async function load() {
    const [g, h] = await Promise.all([
      fetchAll<WeddingGift>('wedding_gifts', 'received_at'),
      fetchAll<Household>('households', 'name'),
    ])
    setGifts(g); setHouseholds(h); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const householdName = useMemo(() => {
    const m = new Map(households.map(h => [h.id, h.name]))
    return (id: string | null) => (id ? m.get(id) : undefined)
  }, [households])

  const byCurrency = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of gifts) m.set(g.currency, (m.get(g.currency) ?? 0) + (Number(g.amount) || 0))
    return [...m.entries()]
  }, [gifts])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    // Need either a household match or a manually typed name — an anonymous
    // amount with no attribution isn't useful to anyone thanking people later.
    const label = givenBy.trim()
    if (!householdId && !label) return
    const row = await insertRow<WeddingGift>('wedding_gifts', {
      household_id: householdId || null,
      given_by: householdId ? null : label,
      amount: amount ? Number(amount) : null,
      currency,
      received_at: receivedAt || null,
      note: note.trim() || null,
    }, 'log gift')
    if (row) {
      setHouseholdId(''); setGivenBy(''); setAmount(''); setReceivedAt(''); setNote('')
      load()
    }
  }

  async function remove(id: string) {
    if (await deleteRow('wedding_gifts', id, 'remove gift')) load()
  }

  if (loading) return <div className="max-w-[900px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <PageHeader title="Gifts" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        <Stat label="Logged" value={gifts.length} />
        {byCurrency.length === 0 ? (
          <Stat label="Total" value="—" />
        ) : (
          byCurrency.map(([c, total]) => (
            <Stat key={c} label={`Total (${c})`} value={c === 'USD' ? money(total) : `${total.toLocaleString()} ${c}`} />
          ))
        )}
      </div>

      <Panel className="mb-6">
        <Label>Log a gift</Label>
        <form onSubmit={add} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Select
              value={householdId}
              onChange={e => { setHouseholdId(e.target.value); if (e.target.value) setGivenBy('') }}
            >
              <option value="">— Pick a household —</option>
              {households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
            <TextInput
              placeholder="Or type a name (not on the guest list)"
              value={givenBy}
              onChange={e => { setGivenBy(e.target.value); if (e.target.value) setHouseholdId('') }}
              disabled={!!householdId}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <TextInput
              type="number" min={0} step="0.01" placeholder="Amount"
              value={amount} onChange={e => setAmount(e.target.value)} className="w-32"
            />
            <Select value={currency} onChange={e => setCurrency(e.target.value)}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </Select>
            <TextInput
              type="date" value={receivedAt} onChange={e => setReceivedAt(e.target.value)}
              aria-label="Date received"
            />
            <TextInput
              placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
              className="flex-1 min-w-[160px]"
            />
            <Btn variant="primary" type="submit">Add</Btn>
          </div>
        </form>
      </Panel>

      {gifts.length === 0 ? (
        <Empty>No gifts logged yet.</Empty>
      ) : (
        <Panel className="!p-0">
          <ul>
            {gifts.map(g => (
              <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-zinc-900 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {householdName(g.household_id) ?? g.given_by ?? 'Unknown'}
                  </p>
                  {g.note && <p className="text-xs text-zinc-600 truncate">{g.note}</p>}
                </div>
                <span className="flex items-center gap-4 shrink-0">
                  {g.received_at && (
                    <span className="text-[10px] tabular-nums text-zinc-500">{g.received_at}</span>
                  )}
                  <span className="text-sm tabular-nums text-zinc-50">
                    {g.amount != null ? (g.currency === 'USD' ? money(g.amount) : `${g.amount.toLocaleString()} ${g.currency}`) : '—'}
                  </span>
                  <button
                    onClick={() => remove(g.id)}
                    className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

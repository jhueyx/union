// Budget — estimates against actuals, optionally tied to a vendor.
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll, insertRow, updateRow, deleteRow, money,
  type BudgetItem, type Vendor,
} from '../../lib/planning'
import { PageHeader, Panel, TextInput, Select, Btn, Empty, Stat, Label } from '../../components/admin/AdminUI'

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Flowers', 'Music', 'Attire', 'Paper', 'Rentals', 'Tea Ceremony', 'Other']

export default function Budget() {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState('Other')
  const [estimated, setEstimated] = useState('')

  async function load() {
    const [i, v] = await Promise.all([
      fetchAll<BudgetItem>('wedding_budget', 'category'),
      fetchAll<Vendor>('wedding_vendors', 'name'),
    ])
    setItems(i); setVendors(v); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totals = useMemo(() => {
    // Postgres numeric arrives as a string over the wire; Number() it before
    // summing or the totals silently become string concatenation.
    let est = 0, act = 0, paid = 0
    for (const i of items) {
      est += Number(i.estimated) || 0
      const a = Number(i.actual) || 0
      act += a
      if (i.paid) paid += a
    }
    return { est, act, paid, outstanding: act - paid, delta: act - est }
  }, [items])

  const byCategory = useMemo(() => {
    const m = new Map<string, { est: number; act: number }>()
    for (const i of items) {
      const k = i.category ?? 'Other'
      const cur = m.get(k) ?? { est: 0, act: 0 }
      cur.est += Number(i.estimated) || 0
      cur.act += Number(i.actual) || 0
      m.set(k, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].est - a[1].est)
  }, [items])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    const row = await insertRow<BudgetItem>('wedding_budget', {
      label: label.trim(), category, estimated: Number(estimated) || 0,
    }, 'add budget item')
    if (row) { setLabel(''); setEstimated(''); load() }
  }

  async function patch(i: BudgetItem, p: Record<string, unknown>) {
    if (!await updateRow('wedding_budget', i.id, p, 'update budget item')) load()
    else load()
  }

  if (loading) return <div className="max-w-[1100px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <PageHeader title="Budget" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Estimated" value={money(totals.est)} />
        <Stat label="Actual" value={money(totals.act)} accent={totals.delta > 0 ? 'text-rose-400' : 'text-zinc-50'} />
        <Stat label="Paid" value={money(totals.paid)} accent="text-emerald-400" />
        <Stat label="Outstanding" value={money(totals.outstanding)} accent={totals.outstanding > 0 ? 'text-amber-400' : undefined} />
      </div>

      {byCategory.length > 0 && (
        <Panel className="mb-8">
          <Label>By category</Label>
          <ul className="space-y-2">
            {byCategory.map(([cat, v]) => {
              const over = v.act > v.est
              return (
                <li key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{cat}</span>
                  <span className="tabular-nums">
                    <span className={over ? 'text-rose-400' : 'text-zinc-300'}>{money(v.act)}</span>
                    <span className="text-zinc-600"> / {money(v.est)}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <TextInput placeholder="Line item…" value={label} onChange={e => setLabel(e.target.value)} className="flex-1 min-w-[200px]" />
        <Select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
        <TextInput type="number" min={0} step={50} placeholder="Estimate" value={estimated} onChange={e => setEstimated(e.target.value)} className="w-32" />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>

      {items.length === 0 ? <Empty>No budget items yet.</Empty> : (
        <Panel className="!p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">
                <th className="text-left font-normal px-5 py-3">Item</th>
                <th className="text-left font-normal px-3 py-3">Category</th>
                <th className="text-right font-normal px-3 py-3">Estimate</th>
                <th className="text-right font-normal px-3 py-3">Actual</th>
                <th className="text-left font-normal px-3 py-3">Vendor</th>
                <th className="text-center font-normal px-3 py-3">Paid</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-zinc-900">
                  <td className="px-5 py-2 text-zinc-200">{i.label}</td>
                  <td className="px-3 py-2 text-zinc-500 text-[10px] tracking-[0.15em] uppercase">{i.category}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{money(Number(i.estimated) || 0)}</td>
                  <td className="px-3 py-2 text-right">
                    <TextInput
                      type="number" min={0} step={50}
                      defaultValue={i.actual ?? ''}
                      onBlur={e => patch(i, { actual: e.target.value === '' ? null : Number(e.target.value) })}
                      className="w-28 text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={i.vendor_id ?? ''}
                      onChange={e => patch(i, { vendor_id: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={i.paid} onChange={() => patch(i, { paid: !i.paid })} className="cursor-pointer" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={async () => { if (await deleteRow('wedding_budget', i.id, 'delete budget item')) load() }}
                      className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  )
}

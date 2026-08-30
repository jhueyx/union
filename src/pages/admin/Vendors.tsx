// Vendor directory — who you are considering, who is booked.
import { useEffect, useMemo, useState } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, type Vendor, type VendorStatus } from '../../lib/planning'
import { PageHeader, Panel, TextInput, Select, Btn, Empty, Stat } from '../../components/admin/AdminUI'

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Video', 'Florist', 'Music', 'Cake', 'Attire', 'Rentals', 'Other']
const STATUS_STYLE: Record<VendorStatus, string> = {
  booked: 'text-emerald-400',
  considering: 'text-amber-400',
  declined: 'text-zinc-600',
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Other')

  async function load() {
    setVendors(await fetchAll<Vendor>('wedding_vendors', 'category'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => ({
    booked: vendors.filter(v => v.status === 'booked').length,
    considering: vendors.filter(v => v.status === 'considering').length,
    total: vendors.length,
  }), [vendors])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const row = await insertRow<Vendor>('wedding_vendors', { name: name.trim(), category }, 'add vendor')
    if (row) { setName(''); load() }
  }

  async function setStatus(v: Vendor, status: VendorStatus) {
    setVendors(vs => vs.map(x => (x.id === v.id ? { ...x, status } : x)))
    if (!await updateRow('wedding_vendors', v.id, { status }, 'update vendor')) load()
  }

  async function setField(v: Vendor, field: keyof Vendor, value: string) {
    if (!await updateRow('wedding_vendors', v.id, { [field]: value || null }, 'update vendor')) load()
  }

  if (loading) return <div className="max-w-[1100px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <PageHeader title="Vendors" />

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Booked" value={counts.booked} accent="text-emerald-400" />
        <Stat label="Considering" value={counts.considering} accent="text-amber-400" />
        <Stat label="Total" value={counts.total} />
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <TextInput placeholder="Vendor name…" value={name} onChange={e => setName(e.target.value)} className="flex-1 min-w-[200px]" />
        <Select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Btn variant="primary" type="submit">Add</Btn>
      </form>

      {vendors.length === 0 ? <Empty>No vendors yet.</Empty> : (
        <div className="space-y-3">
          {vendors.map(v => (
            <Panel key={v.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm text-zinc-50">{v.name}</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-1">{v.category ?? 'Other'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={v.status}
                    onChange={e => setStatus(v, e.target.value as VendorStatus)}
                    className={STATUS_STYLE[v.status]}
                  >
                    <option value="considering">Considering</option>
                    <option value="booked">Booked</option>
                    <option value="declined">Declined</option>
                  </Select>
                  <button
                    onClick={async () => { if (await deleteRow('wedding_vendors', v.id, 'delete vendor')) load() }}
                    className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <TextInput placeholder="Contact" defaultValue={v.contact_name ?? ''} onBlur={e => setField(v, 'contact_name', e.target.value)} />
                <TextInput placeholder="Email" type="email" defaultValue={v.email ?? ''} onBlur={e => setField(v, 'email', e.target.value)} />
                <TextInput placeholder="Phone" defaultValue={v.phone ?? ''} onBlur={e => setField(v, 'phone', e.target.value)} />
                <TextInput placeholder="Website" defaultValue={v.website ?? ''} onBlur={e => setField(v, 'website', e.target.value)} />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}

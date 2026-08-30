// Planning checklist — tasks with optional category and due date.
import { useEffect, useMemo, useState } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, type WeddingTask } from '../../lib/planning'
import { PageHeader, Panel, TextInput, Select, Btn, Empty, Stat } from '../../components/admin/AdminUI'

const CATEGORIES = ['Venue', 'Attire', 'Food', 'Flowers', 'Music', 'Photos', 'Paper', 'Travel', 'Other']

export default function Checklist() {
  const [tasks, setTasks] = useState<WeddingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Other')
  const [due, setDue] = useState('')
  const [showDone, setShowDone] = useState(false)

  async function load() {
    setTasks(await fetchAll<WeddingTask>('wedding_tasks', 'due_date'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const visible = useMemo(
    () => tasks.filter(t => showDone || !t.done),
    [tasks, showDone],
  )
  const stats = useMemo(() => {
    const done = tasks.filter(t => t.done).length
    const today = new Date().toISOString().slice(0, 10)
    const overdue = tasks.filter(t => !t.done && t.due_date && t.due_date < today).length
    return { total: tasks.length, done, open: tasks.length - done, overdue }
  }, [tasks])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const row = await insertRow<WeddingTask>('wedding_tasks', {
      title: title.trim(), category, due_date: due || null,
    }, 'add task')
    if (row) { setTitle(''); setDue(''); load() }
  }

  async function toggle(t: WeddingTask) {
    // Optimistic: a checkbox that waits on a round-trip feels broken. A failed
    // write surfaces as a toast and load() puts the truth back.
    setTasks(ts => ts.map(x => (x.id === t.id ? { ...x, done: !x.done } : x)))
    const ok = await updateRow('wedding_tasks', t.id, {
      done: !t.done, completed_at: !t.done ? new Date().toISOString() : null,
    }, 'update task')
    if (!ok) load()
  }

  if (loading) return <div className="max-w-[1000px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <PageHeader title="Checklist" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Open" value={stats.open} />
        <Stat label="Done" value={stats.done} accent="text-emerald-400" />
        <Stat label="Overdue" value={stats.overdue} accent={stats.overdue ? 'text-rose-400' : undefined} />
        <Stat label="Total" value={stats.total} />
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <TextInput placeholder="What needs doing?" value={title} onChange={e => setTitle(e.target.value)} className="flex-1 min-w-[220px]" />
        <Select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
        <TextInput type="date" value={due} onChange={e => setDue(e.target.value)} />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>

      <label className="flex items-center gap-2 mb-4 text-[10px] tracking-[0.15em] uppercase text-zinc-500 cursor-pointer">
        <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
        Show completed
      </label>

      {visible.length === 0 ? <Empty>Nothing here yet.</Empty> : (
        <Panel className="!p-0">
          <ul>
            {visible.map(t => {
              const overdue = !t.done && t.due_date && t.due_date < today
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-zinc-900 last:border-0">
                  <input type="checkbox" checked={t.done} onChange={() => toggle(t)} className="cursor-pointer" />
                  <span className={'flex-1 text-sm ' + (t.done ? 'text-zinc-600 line-through' : 'text-zinc-200')}>
                    {t.title}
                  </span>
                  {t.category && (
                    <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">{t.category}</span>
                  )}
                  {t.due_date && (
                    <span className={'text-[10px] tabular-nums ' + (overdue ? 'text-rose-400' : 'text-zinc-500')}>
                      {t.due_date}
                    </span>
                  )}
                  <button
                    onClick={async () => { if (await deleteRow('wedding_tasks', t.id, 'delete task')) load() }}
                    className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </div>
  )
}

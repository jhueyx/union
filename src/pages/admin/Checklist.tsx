// Planning checklist — tasks with optional category and due date.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAll, insertRow, insertRows, updateRow, deleteRow, fetchSettings,
  shiftDay, relativeDay, toISODay, today as todayDate,
  type WeddingTask, type WeddingSettings,
} from '../../lib/planning'
import { CHECKLIST_TEMPLATE } from '../../lib/checklistTemplate'
import { PageHeader, Panel, Label, TextInput, Select, Btn, Empty, Stat } from '../../components/admin/AdminUI'

const CATEGORIES = ['Venue', 'Attire', 'Food', 'Flowers', 'Music', 'Photos', 'Paper', 'Travel', 'Tea Ceremony', 'Other']

export default function Checklist() {
  const [tasks, setTasks] = useState<WeddingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Other')
  const [due, setDue] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [rebasing, setRebasing] = useState(false)

  async function load() {
    const [rows, s] = await Promise.all([
      fetchAll<WeddingTask>('wedding_tasks', 'due_date'),
      fetchSettings(),
    ])
    setTasks(rows); setSettings(s); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const visible = useMemo(
    () => tasks.filter(t => showDone || !t.done),
    [tasks, showDone],
  )
  const stats = useMemo(() => {
    const done = tasks.filter(t => t.done).length
    const iso = toISODay(todayDate())
    const overdue = tasks.filter(t => !t.done && t.due_date && t.due_date < iso).length
    const soon = tasks.filter(
      t => !t.done && t.due_date && t.due_date >= iso && t.due_date <= shiftDay(iso, 30),
    ).length
    return { total: tasks.length, done, open: tasks.length - done, overdue, soon }
  }, [tasks])

  /**
   * Seed the standard wedding checklist, dated backwards from the wedding day.
   * Titles already present are skipped, so this is safe to run again after the
   * date moves or after adding tasks by hand — it tops up rather than replaces.
   * Tasks whose date has already passed still get created, dated to today, so a
   * late start surfaces them as due now instead of silently dropping them.
   */
  async function seed() {
    const date = settings?.wedding_date
    if (!date) return
    setSeeding(true)
    const have = new Set(tasks.map(t => t.title.trim().toLowerCase()))
    const iso = toISODay(todayDate())
    const rows = CHECKLIST_TEMPLATE
      .filter(t => !have.has(t.title.trim().toLowerCase()))
      .map(t => {
        const due = shiftDay(date, -t.days)
        return { title: t.title, category: t.category, due_date: due < iso ? iso : due }
      })
    await insertRows('wedding_tasks', rows, 'seed checklist')
    setSeeding(false)
    load()
  }

  /**
   * Re-date open standard tasks against the current wedding date. seed() only
   * tops up titles that are missing, so a task already in the list keeps
   * whatever due date it got the day it was seeded — if the wedding date
   * moves (or was unset and just got set again), those due dates go stale
   * and can misreport tasks as overdue. This walks every open task that
   * matches a template title and recomputes its due date the same way seed()
   * does. Done tasks and hand-added tasks (no template match) are untouched.
   */
  async function rebase() {
    const date = settings?.wedding_date
    if (!date) return
    setRebasing(true)
    const templateByTitle = new Map(
      CHECKLIST_TEMPLATE.map(t => [t.title.trim().toLowerCase(), t]),
    )
    const iso = toISODay(todayDate())
    const changed = tasks
      .filter(t => !t.done)
      .map(t => {
        const tpl = templateByTitle.get(t.title.trim().toLowerCase())
        if (!tpl) return null
        const due = shiftDay(date, -tpl.days)
        const newDue = due < iso ? iso : due
        return newDue !== t.due_date ? { id: t.id, due_date: newDue } : null
      })
      .filter((x): x is { id: string; due_date: string } => x !== null)
    await Promise.all(changed.map(c => updateRow('wedding_tasks', c.id, { due_date: c.due_date }, 'rebase task due date')))
    setRebasing(false)
    load()
  }

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
  const today = toISODay(todayDate())
  const date = settings?.wedding_date ?? null

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      <PageHeader
        title="Checklist"
        action={date
          ? <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">{relativeDay(date)}</span>
          : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Open" value={stats.open} />
        <Stat label="Next 30 days" value={stats.soon} accent={stats.soon ? 'text-amber-400' : undefined} />
        <Stat label="Overdue" value={stats.overdue} accent={stats.overdue ? 'text-rose-400' : undefined} />
        <Stat label="Done" value={stats.done} accent="text-emerald-400" />
        <Stat label="Total" value={stats.total} />
      </div>

      {/* The standard list, dated from the wedding day. Offered whenever
          anything in the template is still missing, so it also tops the list up
          after the date moves. */}
      {date ? (
        <Panel className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Standard checklist</Label>
            <p className="text-sm text-zinc-400">
              {stats.total === 0
                ? `Fill the list from the ${CHECKLIST_TEMPLATE.length} standard wedding tasks, dated backwards from the day.`
                : 'Top the list up with any standard tasks that are missing. Existing tasks are left alone.'}
            </p>
          </div>
          <div className="flex gap-2">
            {stats.total > 0 && (
              <Btn onClick={rebase} disabled={rebasing} title="Re-date open standard tasks against the current wedding date">
                {rebasing ? 'Rebasing…' : 'Rebase due dates'}
              </Btn>
            )}
            <Btn variant="primary" onClick={seed} disabled={seeding}>
              {seeding ? 'Adding…' : stats.total === 0 ? 'Seed checklist' : 'Add missing'}
            </Btn>
          </div>
        </Panel>
      ) : (
        <Panel className="mb-6">
          <Label>Standard checklist</Label>
          <p className="text-sm text-zinc-400">
            Set the wedding date in <Link to="/admin/settings" className="text-zinc-200 underline underline-offset-2">Settings</Link>{' '}
            and the {CHECKLIST_TEMPLATE.length} standard tasks can be dated backwards from it.
          </p>
        </Panel>
      )}

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
                    <span
                      title={t.due_date}
                      className={
                        'text-[10px] tracking-[0.15em] uppercase whitespace-nowrap ' +
                        (overdue ? 'text-rose-400' : 'text-zinc-500')
                      }
                    >
                      {relativeDay(t.due_date)}
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

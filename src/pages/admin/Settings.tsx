// Wedding settings — the fixed point everything else in the planner measures
// from, and (since this table is publicly readable) what actually drives the
// live public site. Editing here takes effect immediately, no deploy needed.
import { useEffect, useState } from 'react'
import {
  fetchSettings, saveSettings, daysUntil, relativeDay, formatDay,
  fetchAll, insertRow, deleteRow,
  type WeddingSettings, type MealOption, type SiteMode,
} from '../../lib/planning'
import { DEFAULT_COMING_SOON_MESSAGE } from '../../lib/siteContent'
import { PageHeader, Panel, Label, TextInput, Btn, Empty } from '../../components/admin/AdminUI'

type Draft = {
  site_mode: SiteMode
  couple_names: string
  coming_soon_message: string
  wedding_date: string
  ceremony_time: string
  venue_name: string
  venue_address: string
  venue_city: string
  venue_maps_url: string
  dress_code: string
  rsvp_deadline: string
  guest_target: string
  single_menu: boolean
}

const DEFAULT_COMING_SOON_TEXT = DEFAULT_COMING_SOON_MESSAGE.join('\n')

const EMPTY: Draft = {
  site_mode: 'coming-soon', couple_names: 'Sally & Jason',
  coming_soon_message: DEFAULT_COMING_SOON_TEXT,
  wedding_date: '', ceremony_time: '', venue_name: '',
  venue_address: '', venue_city: '', venue_maps_url: '', dress_code: '',
  rsvp_deadline: '', guest_target: '', single_menu: false,
}

function toDraft(s: WeddingSettings): Draft {
  return {
    site_mode: s.site_mode,
    couple_names: s.couple_names || 'Sally & Jason',
    coming_soon_message: s.coming_soon_message ?? DEFAULT_COMING_SOON_TEXT,
    wedding_date: s.wedding_date ?? '',
    // Postgres hands back "17:00:00"; <input type="time"> wants "17:00".
    ceremony_time: (s.ceremony_time ?? '').slice(0, 5),
    venue_name: s.venue_name ?? '',
    venue_address: s.venue_address ?? '',
    venue_city: s.venue_city ?? '',
    venue_maps_url: s.venue_maps_url ?? '',
    dress_code: s.dress_code ?? '',
    rsvp_deadline: s.rsvp_deadline ?? '',
    guest_target: s.guest_target == null ? '' : String(s.guest_target),
    single_menu: s.single_menu,
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export default function Settings() {
  const [saved, setSaved] = useState<WeddingSettings | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  const [meals, setMeals] = useState<MealOption[]>([])
  const [mealLabel, setMealLabel] = useState('')
  const [mealDesc, setMealDesc] = useState('')
  const [mealIsChild, setMealIsChild] = useState(false)

  async function load() {
    const [s, m] = await Promise.all([fetchSettings(), fetchAll<MealOption>('wedding_meals', 'position')])
    if (s) { setSaved(s); setDraft(toDraft(s)) }
    setMeals(m)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  /** "Herb-Crusted Salmon" -> a stable, human-readable id for meal_choice_id. */
  function slugify(label: string): string {
    return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'meal'
  }

  async function addMeal(e: React.FormEvent) {
    e.preventDefault()
    const label = mealLabel.trim()
    if (!label) return
    let id = slugify(label)
    // Guard against two meals slugifying to the same id ("Chicken" x2).
    if (meals.some(m => m.id === id)) id = `${id}-${meals.length + 1}`
    const row = await insertRow<MealOption>('wedding_meals', {
      id, label, description: mealDesc.trim() || null,
      is_child_meal: mealIsChild, position: meals.length,
    }, 'add meal')
    if (row) { setMealLabel(''); setMealDesc(''); setMealIsChild(false); load() }
  }

  async function removeMeal(id: string) {
    if (await deleteRow('wedding_meals', id, 'remove meal')) load()
  }

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft(d => ({ ...d, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    const ok = await saveSettings({
      site_mode: draft.site_mode,
      couple_names: draft.couple_names.trim() || 'Sally & Jason',
      coming_soon_message: draft.coming_soon_message.trim() === DEFAULT_COMING_SOON_TEXT.trim()
        ? null
        : draft.coming_soon_message.trim() || null,
      wedding_date: draft.wedding_date || null,
      ceremony_time: draft.ceremony_time || null,
      venue_name: draft.venue_name.trim() || null,
      venue_address: draft.venue_address.trim() || null,
      venue_city: draft.venue_city.trim() || null,
      venue_maps_url: draft.venue_maps_url.trim() || null,
      dress_code: draft.dress_code.trim() || null,
      rsvp_deadline: draft.rsvp_deadline || null,
      guest_target: draft.guest_target ? Number(draft.guest_target) : null,
      single_menu: draft.single_menu,
    })
    setSaving(false)
    if (ok) { setNote('Saved.'); setTimeout(() => setNote(''), 3000); load() }
  }

  if (loading) return <div className="max-w-[900px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  const date = saved?.wedding_date ?? null
  const dirty = saved ? JSON.stringify(toDraft(saved)) !== JSON.stringify(draft) : false

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12 space-y-6">
      <PageHeader
        title="Settings"
        action={note ? <span className="text-[10px] tracking-[0.15em] uppercase text-emerald-400">{note}</span> : undefined}
      />

      {/* Gates the entire public site. Publicly readable, so this takes
          effect the moment it's saved — no deploy, no waiting on Vercel. */}
      <Panel className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label>Site status</Label>
            <p className="text-sm text-zinc-400">
              {draft.site_mode === 'live'
                ? 'The full site is live — nav, story, RSVP, everything below.'
                : 'Guests see only the coming-soon landing page below. Nav is hidden.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(['coming-soon', 'live'] as const).map(m => (
              <button
                key={m}
                onClick={() => setDraft(d => ({ ...d, site_mode: m }))}
                className={
                  'text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-[2px] border transition-colors ' +
                  (draft.site_mode === m
                    ? 'border-zinc-500 text-zinc-50'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300')
                }
              >
                {m === 'live' ? 'Live' : 'Coming soon'}
              </button>
            ))}
          </div>
        </div>

        {draft.site_mode === 'coming-soon' && (
          <div>
            <Label>Coming-soon message</Label>
            <p className="text-sm text-zinc-400 mb-3">
              What guests see under the SJ monogram right now. One paragraph per line.
            </p>
            <textarea
              value={draft.coming_soon_message}
              onChange={e => setDraft(d => ({ ...d, coming_soon_message: e.target.value }))}
              rows={4}
              className="w-full bg-transparent border border-zinc-800 rounded-[2px] px-3 py-2 text-sm text-zinc-50 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-y"
            />
          </div>
        )}
      </Panel>

      {date ? (
        <Panel>
          <Label>The day</Label>
          <p className="text-2xl font-[300] text-zinc-50">{formatDay(date)}</p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-2">
            {relativeDay(date)}
            {daysUntil(date) >= 0 && ` · ${daysUntil(date)} days`}
          </p>
        </Panel>
      ) : (
        <Panel>
          <Label>The day</Label>
          <p className="text-sm text-zinc-400">
            Not set. Until there is a date, the checklist cannot say what is overdue
            and nothing else in the planner has a fixed point to measure from.
          </p>
        </Panel>
      )}

      <Panel className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Couple names">
            <TextInput value={draft.couple_names} onChange={set('couple_names')} className="w-full" />
          </Field>
          <Field label="Dress code">
            <TextInput value={draft.dress_code} onChange={set('dress_code')} placeholder="e.g. Black Tie Optional" className="w-full" />
          </Field>
          <Field label="Wedding date">
            <TextInput type="date" value={draft.wedding_date} onChange={set('wedding_date')} className="w-full" />
          </Field>
          <Field label="Ceremony time">
            <TextInput type="time" value={draft.ceremony_time} onChange={set('ceremony_time')} className="w-full" />
          </Field>
          <Field label="Venue">
            <TextInput value={draft.venue_name} onChange={set('venue_name')} placeholder="Venue name" className="w-full" />
          </Field>
          <Field label="Venue city">
            <TextInput value={draft.venue_city} onChange={set('venue_city')} placeholder="e.g. San Francisco" className="w-full" />
          </Field>
          <Field label="Venue address">
            <TextInput value={draft.venue_address} onChange={set('venue_address')} placeholder="Street, city" className="w-full" />
          </Field>
          <Field label="Venue map link">
            <TextInput value={draft.venue_maps_url} onChange={set('venue_maps_url')} placeholder="Google Maps share URL" className="w-full" />
          </Field>
          <Field label="RSVP deadline">
            <TextInput type="date" value={draft.rsvp_deadline} onChange={set('rsvp_deadline')} className="w-full" />
          </Field>
          <Field label="Guest target">
            <TextInput
              type="number" min={0} value={draft.guest_target} onChange={set('guest_target')}
              placeholder="e.g. 80" className="w-full"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Btn variant="primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save'}
          </Btn>
          {dirty && <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-600">Unsaved changes</span>}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label>Banquet style</Label>
            <p className="text-sm text-zinc-400">
              One fixed menu served to every table, rather than each guest
              picking an entrée. Turns off the meal-choice step in RSVP —
              guests just say who's coming, with dietary notes for the kitchen.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-300 cursor-pointer whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={draft.single_menu}
              onChange={e => setDraft(d => ({ ...d, single_menu: e.target.checked }))}
            />
            Single menu
          </label>
        </div>
      </Panel>

      <Panel className={draft.single_menu ? 'opacity-50' : undefined}>
        <div className="flex items-baseline justify-between mb-1">
          <Label>Meal options</Label>
          <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-600">{meals.length}</span>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          {draft.single_menu
            ? "Not used while Banquet style is on — guests don't choose between these during RSVP."
            : 'What guests choose from during RSVP. Empty means the RSVP meal step has nothing to offer and cannot be completed.'}
        </p>

        {meals.length > 0 && (
          <ul className="space-y-1 mb-4">
            {meals.map(m => (
              <li key={m.id} className="flex items-center justify-between py-1.5 border-b border-zinc-900 last:border-0">
                <span className="text-sm text-zinc-300">
                  {m.label}
                  {m.description && <span className="text-zinc-600"> — {m.description}</span>}
                  {m.is_child_meal && (
                    <span className="ml-2 text-[10px] tracking-[0.15em] uppercase text-zinc-500">Children's</span>
                  )}
                </span>
                <button
                  onClick={() => removeMeal(m.id)}
                  className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addMeal} className="flex flex-wrap items-center gap-2">
          <TextInput
            placeholder="e.g. Herb-Crusted Salmon"
            value={mealLabel}
            onChange={e => setMealLabel(e.target.value)}
            className="flex-1 min-w-[180px]"
          />
          <TextInput
            placeholder="Description (optional)"
            value={mealDesc}
            onChange={e => setMealDesc(e.target.value)}
            className="flex-1 min-w-[180px]"
          />
          <label className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-500 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={mealIsChild} onChange={e => setMealIsChild(e.target.checked)} />
            Children's
          </label>
          <Btn variant="primary" type="submit">Add</Btn>
        </form>
      </Panel>

    </div>
  )
}

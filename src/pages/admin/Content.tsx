// Site content — the four guest-facing pages that used to be static arrays in
// src/data/mock.ts, requiring a code deploy to change anything. Now live in
// their own tables (public SELECT, admin-only write), edited here, and
// reflected on the site the moment they're saved.
//
// Each tab follows the same two-step shape already used for vendors: an add
// form with just enough to create the row, then every other field edited
// inline in the list via onBlur — building the list is a different act from
// filling in every detail, and a giant add form for e.g. seven travel fields
// would be exactly the kind of friction that keeps a list at zero rows.
import { useEffect, useRef, useState } from 'react'
import {
  fetchAll, insertRow, updateRow, deleteRow, fetchSettings, saveSettings,
  type FaqItem, type TravelItem, type RegistryItem, type PublicEvent, type StoryItem,
  type PhotoItem, type WeddingSettings,
} from '../../lib/planning'
import { photoUrl, uploadPhoto, deletePhotoFile } from '../../lib/photos'
import { PageHeader, Panel, Label, TextInput, Select, Btn, Empty } from '../../components/admin/AdminUI'

type View = 'story' | 'photos' | 'faq' | 'travel' | 'registry' | 'schedule'
const VIEWS: [View, string][] = [
  ['story', 'Story'], ['photos', 'Photos'], ['faq', 'FAQ'], ['travel', 'Travel'],
  ['registry', 'Registry'], ['schedule', 'Schedule'],
]

const TEXTAREA_CLS =
  'w-full bg-transparent border border-zinc-800 rounded-[2px] px-3 py-2 text-sm text-zinc-50 ' +
  'placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-y'

function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <Panel className="space-y-3">
      {children}
      <div className="flex justify-end">
        <button
          onClick={onRemove}
          className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 hover:text-rose-400 transition-colors"
        >
          Remove
        </button>
      </div>
    </Panel>
  )
}

// ── Story ────────────────────────────────────────────────────────────────

function StoryTab() {
  const [items, setItems] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [heading, setHeading] = useState('')

  async function load() {
    setItems(await fetchAll<StoryItem>('wedding_story', 'position'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!heading.trim()) return
    const row = await insertRow<StoryItem>('wedding_story', {
      heading: heading.trim(), body: '', position: items.length,
    }, 'add story section')
    if (row) { setHeading(''); load() }
  }

  async function setField(item: StoryItem, field: 'heading' | 'body', value: string) {
    if (await updateRow('wedding_story', item.id, { [field]: value }, 'update story section')) load()
  }

  if (loading) return <Empty>Loading…</Empty>
  return (
    <>
      <p className="text-sm text-zinc-500 mb-4">
        Shown in order on /story, under the couple's names and a photo — set
        that on the Photos tab.
      </p>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <TextInput placeholder="New section heading, e.g. How We Met…" value={heading} onChange={e => setHeading(e.target.value)} className="flex-1" />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>
      {items.length === 0 ? <Empty>No story sections yet.</Empty> : (
        <div className="space-y-3">
          {items.map(item => (
            <Row key={item.id} onRemove={async () => { if (await deleteRow('wedding_story', item.id, 'remove story section')) load() }}>
              <TextInput
                defaultValue={item.heading} onBlur={e => setField(item, 'heading', e.target.value)}
                className="w-full" aria-label="Heading"
              />
              <textarea
                defaultValue={item.body} onBlur={e => setField(item, 'body', e.target.value)}
                placeholder="Section text…" rows={4} className={TEXTAREA_CLS} aria-label="Body"
              />
            </Row>
          ))}
        </div>
      )}
    </>
  )
}

// ── Photos ───────────────────────────────────────────────────────────────

/** One single-photo slot (Story, Save the Date) — upload/replace/remove,
 *  with the old storage object cleaned up on replace or remove so nothing
 *  orphans in the bucket. */
function PhotoSlot({
  label, path, prefix, onChange,
}: {
  label: string
  path: string | null
  prefix: string
  onChange: (path: string | null) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    const oldPath = path
    const newPath = await uploadPhoto(file, prefix)
    if (newPath) {
      await onChange(newPath)
      await deletePhotoFile(oldPath)
    }
    setBusy(false)
  }

  async function remove() {
    setBusy(true)
    await onChange(null)
    await deletePhotoFile(path)
    setBusy(false)
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {path ? (
          <img src={photoUrl(path) ?? ''} alt="" className="w-28 h-20 object-cover rounded-[2px] border border-zinc-800" />
        ) : (
          <div className="w-28 h-20 rounded-[2px] border border-dashed border-zinc-800 flex items-center justify-center text-[10px] tracking-[0.15em] uppercase text-zinc-600">
            None
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Btn onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : path ? 'Replace' : 'Upload'}
          </Btn>
          {path && <Btn variant="danger" onClick={remove} disabled={busy}>Remove</Btn>}
        </div>
      </div>
    </div>
  )
}

function PhotosTab() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [gallery, setGallery] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [s, g] = await Promise.all([fetchSettings(), fetchAll<PhotoItem>('wedding_photos', 'position')])
    setSettings(s); setGallery(g); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setStoryPhoto(path: string | null) {
    if (await saveSettings({ story_photo_path: path })) load()
  }
  async function setStdPhoto(path: string | null) {
    if (await saveSettings({ save_the_date_photo_path: path })) load()
  }

  async function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setUploadingGallery(true)
    let position = gallery.length
    for (const file of files) {
      const path = await uploadPhoto(file, 'gallery')
      if (path) {
        await insertRow<PhotoItem>('wedding_photos', { storage_path: path, caption: null, position }, 'add photo')
        position++
      }
    }
    setUploadingGallery(false)
    load()
  }

  async function removeGalleryPhoto(p: PhotoItem) {
    if (await deleteRow('wedding_photos', p.id, 'remove photo')) {
      await deletePhotoFile(p.storage_path)
      load()
    }
  }

  if (loading || !settings) return <Empty>Loading…</Empty>
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <PhotoSlot label="Story photo" path={settings.story_photo_path} prefix="story" onChange={setStoryPhoto} />
        <PhotoSlot label="Save the Date photo" path={settings.save_the_date_photo_path} prefix="save-the-date" onChange={setStdPhoto} />
      </div>

      <div className="flex items-baseline justify-between mb-1">
        <Label>Gallery</Label>
        <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-600">{gallery.length}</span>
      </div>
      <p className="text-sm text-zinc-500 mb-4">Shown on /photos. Add as many as you like.</p>

      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryFiles} className="hidden" />
      <Btn variant="primary" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
        {uploadingGallery ? 'Uploading…' : '+ Add photos'}
      </Btn>

      <div className="mt-4">
        {gallery.length === 0 ? <Empty>No gallery photos yet.</Empty> : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {gallery.map(p => (
              <div key={p.id} className="relative">
                <img
                  src={photoUrl(p.storage_path) ?? ''} alt=""
                  className="aspect-square object-cover rounded-[2px] border border-zinc-800 w-full"
                />
                <button
                  onClick={() => removeGalleryPhoto(p)}
                  className="absolute top-1 right-1 text-[10px] tracking-[0.1em] uppercase bg-black/70 text-zinc-300 hover:text-rose-400 px-1.5 py-0.5 rounded-[2px] transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── FAQ ──────────────────────────────────────────────────────────────────

function FaqTab() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')

  async function load() {
    setItems(await fetchAll<FaqItem>('wedding_faq', 'position'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    const row = await insertRow<FaqItem>('wedding_faq', {
      question: question.trim(), answer: '', category: null, position: items.length,
    }, 'add FAQ item')
    if (row) { setQuestion(''); load() }
  }

  async function setField(item: FaqItem, field: 'question' | 'answer' | 'category', value: string) {
    if (await updateRow('wedding_faq', item.id, { [field]: field === 'category' ? (value || null) : value }, 'update FAQ item')) load()
  }

  if (loading) return <Empty>Loading…</Empty>
  return (
    <>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <TextInput placeholder="New question…" value={question} onChange={e => setQuestion(e.target.value)} className="flex-1" />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>
      {items.length === 0 ? <Empty>No FAQ items yet.</Empty> : (
        <div className="space-y-3">
          {items.map(item => (
            <Row key={item.id} onRemove={async () => { if (await deleteRow('wedding_faq', item.id, 'remove FAQ item')) load() }}>
              <div className="flex flex-wrap gap-2">
                <TextInput
                  defaultValue={item.question} onBlur={e => setField(item, 'question', e.target.value)}
                  className="flex-1 min-w-[220px]" aria-label="Question"
                />
                <TextInput
                  defaultValue={item.category ?? ''} onBlur={e => setField(item, 'category', e.target.value)}
                  placeholder="Category" className="w-40" aria-label="Category"
                />
              </div>
              <textarea
                defaultValue={item.answer} onBlur={e => setField(item, 'answer', e.target.value)}
                placeholder="Answer…" rows={2} className={TEXTAREA_CLS} aria-label="Answer"
              />
            </Row>
          ))}
        </div>
      )}
    </>
  )
}

// ── Travel ───────────────────────────────────────────────────────────────

const TRAVEL_TYPES: TravelItem['type'][] = ['hotel', 'transport', 'activity', 'restaurant']

function TravelTab() {
  const [items, setItems] = useState<TravelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [type, setType] = useState<TravelItem['type']>('hotel')

  async function load() {
    setItems(await fetchAll<TravelItem>('wedding_travel', 'position'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const row = await insertRow<TravelItem>('wedding_travel', {
      name: name.trim(), type, address: null, url: null, note: null,
      price_range: null, booking_code: null, position: items.length,
    }, 'add travel item')
    if (row) { setName(''); load() }
  }

  async function setField(item: TravelItem, field: keyof TravelItem, value: string) {
    if (await updateRow('wedding_travel', item.id, { [field]: value || null }, 'update travel item')) load()
  }

  if (loading) return <Empty>Loading…</Empty>
  return (
    <>
      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <TextInput placeholder="Name…" value={name} onChange={e => setName(e.target.value)} className="flex-1 min-w-[180px]" />
        <Select value={type} onChange={e => setType(e.target.value as TravelItem['type'])}>
          {TRAVEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Btn variant="primary" type="submit">Add</Btn>
      </form>
      {items.length === 0 ? <Empty>No travel info yet.</Empty> : (
        <div className="space-y-3">
          {items.map(item => (
            <Row key={item.id} onRemove={async () => { if (await deleteRow('wedding_travel', item.id, 'remove travel item')) load() }}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <TextInput
                  defaultValue={item.name} onBlur={e => setField(item, 'name', e.target.value)}
                  className="flex-1 min-w-[180px]" aria-label="Name"
                />
                <Select
                  defaultValue={item.type}
                  onChange={async e => { if (await updateRow('wedding_travel', item.id, { type: e.target.value }, 'update travel item')) load() }}
                >
                  {TRAVEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <TextInput placeholder="Address" defaultValue={item.address ?? ''} onBlur={e => setField(item, 'address', e.target.value)} />
                <TextInput placeholder="Booking URL" defaultValue={item.url ?? ''} onBlur={e => setField(item, 'url', e.target.value)} />
                <TextInput placeholder="Price range" defaultValue={item.price_range ?? ''} onBlur={e => setField(item, 'price_range', e.target.value)} />
                <TextInput placeholder="Booking code" defaultValue={item.booking_code ?? ''} onBlur={e => setField(item, 'booking_code', e.target.value)} />
              </div>
              <textarea
                defaultValue={item.note ?? ''} onBlur={e => setField(item, 'note', e.target.value)}
                placeholder="Note (optional)" rows={2} className={TEXTAREA_CLS} aria-label="Note"
              />
            </Row>
          ))}
        </div>
      )}
    </>
  )
}

// ── Registry ─────────────────────────────────────────────────────────────

function RegistryTab() {
  const [items, setItems] = useState<RegistryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState('')
  const [url, setUrl] = useState('')

  async function load() {
    setItems(await fetchAll<RegistryItem>('wedding_registry', 'position'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!store.trim() || !url.trim()) return
    const row = await insertRow<RegistryItem>('wedding_registry', {
      store: store.trim(), url: url.trim(), note: null, position: items.length,
    }, 'add registry item')
    if (row) { setStore(''); setUrl(''); load() }
  }

  async function setField(item: RegistryItem, field: 'store' | 'url' | 'note', value: string) {
    if (!value && field !== 'note') return // store/url can't be blanked to empty
    if (await updateRow('wedding_registry', item.id, { [field]: field === 'note' ? (value || null) : value }, 'update registry item')) load()
  }

  if (loading) return <Empty>Loading…</Empty>
  return (
    <>
      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <TextInput placeholder="Store…" value={store} onChange={e => setStore(e.target.value)} className="flex-1 min-w-[140px]" />
        <TextInput placeholder="Registry URL…" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 min-w-[200px]" />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>
      {items.length === 0 ? <Empty>No registry links yet.</Empty> : (
        <div className="space-y-3">
          {items.map(item => (
            <Row key={item.id} onRemove={async () => { if (await deleteRow('wedding_registry', item.id, 'remove registry item')) load() }}>
              <div className="flex flex-wrap gap-2">
                <TextInput defaultValue={item.store} onBlur={e => setField(item, 'store', e.target.value)} className="w-40" aria-label="Store" />
                <TextInput defaultValue={item.url} onBlur={e => setField(item, 'url', e.target.value)} className="flex-1 min-w-[200px]" aria-label="URL" />
              </div>
              <TextInput
                defaultValue={item.note ?? ''} onBlur={e => setField(item, 'note', e.target.value)}
                placeholder="Note (optional)" className="w-full" aria-label="Note"
              />
            </Row>
          ))}
        </div>
      )}
    </>
  )
}

// ── Schedule (public) ───────────────────────────────────────────────────

function ScheduleTab() {
  const [items, setItems] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [time, setTime] = useState('')

  async function load() {
    setItems(await fetchAll<PublicEvent>('wedding_events', 'position'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !time.trim()) return
    const row = await insertRow<PublicEvent>('wedding_events', {
      name: name.trim(), time_label: time.trim(), end_time_label: null,
      location: null, address: null, description: null, dresscode: null, position: items.length,
    }, 'add schedule item')
    if (row) { setName(''); setTime(''); load() }
  }

  async function setField(item: PublicEvent, field: keyof PublicEvent, value: string) {
    if (await updateRow('wedding_events', item.id, { [field]: value || null }, 'update schedule item')) load()
  }

  if (loading) return <Empty>Loading…</Empty>
  return (
    <>
      <p className="text-sm text-zinc-500 mb-4">
        The guest-facing schedule on /schedule and /invitation — separate from
        the internal day-of Timeline, which can carry detail not meant for guests.
      </p>
      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <TextInput placeholder="Event name…" value={name} onChange={e => setName(e.target.value)} className="flex-1 min-w-[180px]" />
        <TextInput placeholder="Time (e.g. 5:00 PM)" value={time} onChange={e => setTime(e.target.value)} className="w-40" />
        <Btn variant="primary" type="submit">Add</Btn>
      </form>
      {items.length === 0 ? <Empty>No schedule items yet.</Empty> : (
        <div className="space-y-3">
          {items.map(item => (
            <Row key={item.id} onRemove={async () => { if (await deleteRow('wedding_events', item.id, 'remove schedule item')) load() }}>
              <div className="flex flex-wrap gap-2">
                <TextInput defaultValue={item.name} onBlur={e => setField(item, 'name', e.target.value)} className="flex-1 min-w-[180px]" aria-label="Name" />
                <TextInput defaultValue={item.time_label} onBlur={e => setField(item, 'time_label', e.target.value)} placeholder="Time" className="w-32" aria-label="Time" />
                <TextInput defaultValue={item.end_time_label ?? ''} onBlur={e => setField(item, 'end_time_label', e.target.value)} placeholder="Until (optional)" className="w-32" aria-label="End time" />
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <TextInput placeholder="Location" defaultValue={item.location ?? ''} onBlur={e => setField(item, 'location', e.target.value)} />
                <TextInput placeholder="Dress code" defaultValue={item.dresscode ?? ''} onBlur={e => setField(item, 'dresscode', e.target.value)} />
              </div>
              <TextInput placeholder="Address (for a map link)" defaultValue={item.address ?? ''} onBlur={e => setField(item, 'address', e.target.value)} className="w-full" />
              <textarea
                defaultValue={item.description ?? ''} onBlur={e => setField(item, 'description', e.target.value)}
                placeholder="Description (optional)" rows={2} className={TEXTAREA_CLS} aria-label="Description"
              />
            </Row>
          ))}
        </div>
      )}
    </>
  )
}

export default function Content() {
  const [view, setView] = useState<View>('story')

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <PageHeader title="Content" />

      <div className="flex flex-wrap gap-2 mb-6">
        {VIEWS.map(([key, label]) => (
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
            {label}
          </button>
        ))}
      </div>

      {view === 'story' && <StoryTab />}
      {view === 'photos' && <PhotosTab />}
      {view === 'faq' && <FaqTab />}
      {view === 'travel' && <TravelTab />}
      {view === 'registry' && <RegistryTab />}
      {view === 'schedule' && <ScheduleTab />}
    </div>
  )
}

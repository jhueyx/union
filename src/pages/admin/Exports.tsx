// Exports — the paper the wedding actually runs on.
//
// Three audiences, three shapes:
//   Addresses  the calligrapher or label sheet, one block per household
//   Catering   the headcount the caterer and venue ask for, with dietary notes
//   Seating    the chart the venue sets the room from
//
// Everything is copied or printed rather than downloaded: a CSV lands in a
// Downloads folder and is never seen again, while these get pasted into an
// email or handed over on paper, which is how they are actually used.
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAll, fetchSettings, addressLines, hasAddress, SIDE_LABEL, tablesNeeded,
  type Guest, type Household, type RsvpResponse, type WeddingTable, type SeatAssignment,
  type MealOption, type WeddingSettings,
} from '../../lib/planning'
import { PageHeader, Panel, Label, Btn, Empty } from '../../components/admin/AdminUI'

type View = 'addresses' | 'catering' | 'seating'

const VIEWS: [View, string][] = [
  ['addresses', 'Addresses'],
  ['catering', 'Catering'],
  ['seating', 'Seating chart'],
]

export default function Exports() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([])
  const [tables, setTables] = useState<WeddingTable[]>([])
  const [seats, setSeats] = useState<SeatAssignment[]>([])
  const [meals, setMeals] = useState<MealOption[]>([])
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('addresses')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchAll<Household>('households', 'name'),
      fetchAll<Guest>('guests', 'last_name'),
      fetchAll<RsvpResponse>('rsvp_responses'),
      fetchAll<WeddingTable>('wedding_tables', 'name'),
      fetchAll<SeatAssignment>('wedding_seat_assignments'),
      fetchAll<MealOption>('wedding_meals', 'position'),
      fetchSettings(),
    ]).then(([h, g, r, t, s, m, se]) => {
      setHouseholds(h); setGuests(g); setRsvps(r); setTables(t); setSeats(s); setMeals(m)
      setSettings(se); setLoading(false)
    })
  }, [])

  const guestsOf = useMemo(() => {
    const m = new Map<string, Guest[]>()
    for (const g of guests) {
      const l = m.get(g.household_id) ?? []; l.push(g); m.set(g.household_id, l)
    }
    return m
  }, [guests])

  const rsvpOf = useMemo(() => {
    const m = new Map<string, RsvpResponse>()
    for (const r of rsvps) if (r.guest_id) m.set(r.guest_id, r)
    return m
  }, [rsvps])

  /**
   * Who to cater for. Falls back to everyone invited until RSVPs start coming
   * in — a caterer asking early wants the working number, and a report that
   * reads zero because nobody has replied yet is worse than useless.
   */
  const attending = useMemo(() => {
    const confirmed = guests.filter(g => rsvpOf.get(g.id)?.attending === true)
    return { rows: confirmed.length ? confirmed : guests, provisional: confirmed.length === 0 }
  }, [guests, rsvpOf])

  const text = useMemo(() => {
    if (view === 'addresses') {
      const addressed = households.filter(hasAddress)
      if (!addressed.length) return ''
      return addressed.map(h => {
        const names = (guestsOf.get(h.id) ?? [])
          .map(g => `${g.first_name} ${g.last_name}`.trim()).join(' & ')
        return [names || h.name, ...addressLines(h)].join('\n')
      }).join('\n\n')
    }

    if (view === 'catering') {
      const { rows } = attending
      const adults = rows.filter(g => !g.is_child).length
      const children = rows.filter(g => g.is_child).length
      const dietary = rows
        .map(g => [g, rsvpOf.get(g.id)] as const)
        .filter(([, r]) => r?.dietary_restrictions?.trim())
        .map(([g, r]) => `  ${g.first_name} ${g.last_name} — ${r!.dietary_restrictions!.trim()}`)

      // Banquet-style: one fixed menu, so there is nothing to break down by
      // choice — what a restaurant actually asks for is the table count.
      const singleMenu = settings?.single_menu ?? false
      const menuSection = singleMenu
        ? [`TABLES`, `  ${tablesNeeded(rows.length, tables)} tables, fixed banquet menu`]
        : (() => {
            const mealLabel = new Map(meals.map(m => [m.id, m.label]))
            const mealCounts = new Map<string, number>()
            let unchosen = 0
            for (const g of rows) {
              const id = rsvpOf.get(g.id)?.meal_choice_id
              if (!id) { unchosen++; continue }
              mealCounts.set(id, (mealCounts.get(id) ?? 0) + 1)
            }
            const mealLines = [...mealCounts.entries()]
              .map(([id, n]) => `  ${(mealLabel.get(id) ?? id).padEnd(24)}${n}`)
            return [
              `MEAL COUNTS`,
              ...(mealLines.length ? mealLines : ['  No meals selected yet.']),
              ...(unchosen ? [`  Unchosen${' '.repeat(16)}${unchosen}`] : []),
            ]
          })()

      return [
        `HEADCOUNT`,
        `  Adults    ${adults}`,
        `  Children  ${children}`,
        `  Total     ${rows.length}`,
        '',
        ...menuSection,
        '',
        `DIETARY REQUIREMENTS (${dietary.length})`,
        ...(dietary.length ? dietary : ['  None reported.']),
      ].join('\n')
    }

    const byTable = new Map<string, string[]>()
    const nameOf = new Map(guests.map(g => [g.id, `${g.first_name} ${g.last_name}`.trim()]))
    for (const s of seats) {
      const l = byTable.get(s.table_id) ?? []
      const n = nameOf.get(s.guest_id)
      if (n) l.push(n)
      byTable.set(s.table_id, l)
    }
    if (!tables.length) return ''
    return tables.map(t => {
      const list = (byTable.get(t.id) ?? []).sort()
      return [
        `${t.name.toUpperCase()} (${list.length}/${t.capacity})`,
        ...(list.length ? list.map(n => `  ${n}`) : ['  — empty —']),
      ].join('\n')
    }).join('\n\n')
  }, [view, households, guestsOf, attending, rsvpOf, tables, seats, guests, meals, settings])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the text is on screen and selectable.
      setCopied(false)
    }
  }

  if (loading) return <div className="max-w-[900px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  const missing = households.filter(h => !hasAddress(h)).length

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <PageHeader
        title="Exports"
        action={
          <div className="flex gap-2">
            <Btn onClick={copy} disabled={!text}>{copied ? 'Copied' : 'Copy'}</Btn>
            <Btn variant="primary" onClick={() => window.print()} disabled={!text}>Print</Btn>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
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

      {view === 'addresses' && missing > 0 && (
        <p className="text-[10px] tracking-[0.15em] uppercase text-amber-400 mb-4 print:hidden">
          {missing} of {households.length} households have no address yet — they are not in this list
        </p>
      )}
      {view === 'catering' && attending.provisional && (
        <p className="text-[10px] tracking-[0.15em] uppercase text-amber-400 mb-4 print:hidden">
          No RSVPs yet — counting everyone invited
        </p>
      )}
      {view === 'seating' && (
        <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-4 print:hidden">
          {tables.length} tables · {seats.length} seated
        </p>
      )}

      {/* Print styles live inline: this is the only page that prints, and the
          rules are about this element rather than the app. */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .print-sheet { color: #000 !important; background: #fff !important;
                         border: 0 !important; font-size: 11pt; }
          nav, header { display: none !important; }
        }
      `}</style>

      {text ? (
        <Panel className="print-sheet">
          <Label>
            {view === 'addresses' ? `${households.filter(hasAddress).length} households`
              : view === 'catering' ? `${attending.rows.length} covers`
              : `${tables.length} tables`}
          </Label>
          <pre className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">{text}</pre>
        </Panel>
      ) : (
        <Empty>
          {view === 'addresses' ? 'No household has an address yet — add one from the Guests page.'
            : view === 'catering' ? 'No guests yet.'
            : 'No tables yet — build the floor plan on the Seating page.'}
        </Empty>
      )}

      {view === 'addresses' && households.some(h => (h.side ?? null) !== null) && (
        <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 mt-4 print:hidden">
          {(['bride', 'groom', 'both'] as const).map(s =>
            `${SIDE_LABEL[s]} ${households.filter(h => h.side === s && hasAddress(h)).length}`).join(' · ')}
        </p>
      )}
    </div>
  )
}

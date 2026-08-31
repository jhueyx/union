// Seating chart — a floor plan you arrange, with guests dragged onto tables.
//
// Two different drags share this page and they are deliberately implemented
// differently:
//
//   Guest -> table   dnd-kit. It needs drop targets, collision detection and a
//                    drag overlay, which is exactly what dnd-kit is for.
//   Table -> canvas  raw pointer events. A table is positioned freely in
//                    continuous space; dnd-kit's transform model fights that,
//                    and pointer deltas map to pos_x/pos_y directly.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  fetchAll, insertRow, updateRow, deleteRow, SIDE_LABEL,
  type Guest, type Household, type SeatAssignment, type WeddingTable, type RsvpResponse,
  type Side,
} from '../../lib/planning'
import { PageHeader, Label, TextInput, Select, Btn, Empty } from '../../components/admin/AdminUI'

const CANVAS_W = 1600
const CANVAS_H = 1000

function GuestChip({ guest, seated }: { guest: Guest; seated?: boolean }) {
  return (
    <span
      title={guest.is_child ? `${guest.first_name} ${guest.last_name} — child` : undefined}
      className={
        'inline-block px-2 py-1 rounded-[2px] text-xs whitespace-nowrap border ' +
        // Children get a dashed edge rather than a colour: the admin palette is
        // grayscale, and a kids' table is something you want to spot on sight.
        (guest.is_child ? 'border-dashed ' : '') +
        (seated
          ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
          : 'bg-zinc-900 border-zinc-700 text-zinc-200')
      }
    >
      {guest.first_name} {guest.last_name}
    </span>
  )
}

function DraggableGuest({ guest, seated }: { guest: Guest; seated?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `guest:${guest.id}` })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={'cursor-grab active:cursor-grabbing touch-none ' + (isDragging ? 'opacity-30' : '')}
    >
      <GuestChip guest={guest} seated={seated} />
    </div>
  )
}

function TableNode({
  table, seated, onMove, onSelect, selected,
}: {
  table: WeddingTable
  seated: Guest[]
  onMove: (id: string, x: number, y: number) => void
  onSelect: (id: string) => void
  selected: boolean
}) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `table:${table.id}` })
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  // Pointer-drag to reposition. Capture keeps the gesture alive if the cursor
  // leaves the element, which happens constantly when dragging quickly.
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('[data-guest]')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: table.pos_x, origY: table.pos_y }
    onSelect(table.id)
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragState.current
    if (!d) return
    onMove(table.id, d.origX + (e.clientX - d.startX), d.origY + (e.clientY - d.startY))
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!dragState.current) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    dragState.current = null
    onMove(table.id, table.pos_x, table.pos_y) // commit
  }

  const over = seated.length > table.capacity
  const size = table.shape === 'round' ? 190 : 230

  return (
    <div
      ref={dropRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left: table.pos_x, top: table.pos_y,
        width: size, minHeight: table.shape === 'round' ? size : 150,
      }}
      className={
        'absolute select-none cursor-move p-3 transition-colors ' +
        (table.shape === 'round' ? 'rounded-full' : 'rounded-[4px]') + ' ' +
        (isOver ? 'bg-zinc-800 border-zinc-500 ' : 'bg-zinc-950 ') +
        'border ' +
        (over ? 'border-rose-700 ' : selected ? 'border-zinc-500 ' : 'border-zinc-800 ')
      }
    >
      <div className="text-center mb-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400">{table.name}</p>
        <p className={'text-[10px] tabular-nums ' + (over ? 'text-rose-400' : 'text-zinc-600')}>
          {seated.length}/{table.capacity}
        </p>
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        {seated.map(g => (
          <div key={g.id} data-guest>
            <DraggableGuest guest={g} seated />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Seating() {
  const [tables, setTables] = useState<WeddingTable[]>([])
  const [assignments, setAssignments] = useState<SeatAssignment[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<Guest | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newShape, setNewShape] = useState<'round' | 'rect'>('round')
  const [newCap, setNewCap] = useState(8)
  const [addingTable, setAddingTable] = useState(false)
  const [attendingOnly, setAttendingOnly] = useState(true)
  const [sideFilter, setSideFilter] = useState<Side | 'all'>('all')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function load() {
    const [t, a, g, h, r] = await Promise.all([
      fetchAll<WeddingTable>('wedding_tables', 'name'),
      fetchAll<SeatAssignment>('wedding_seat_assignments'),
      fetchAll<Guest>('guests', 'last_name'),
      fetchAll<Household>('households', 'name'),
      fetchAll<RsvpResponse>('rsvp_responses'),
    ])
    setTables(t); setAssignments(a); setGuests(g); setHouseholds(h); setRsvps(r); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const householdName = useMemo(() => {
    const m = new Map(households.map(h => [h.id, h.name]))
    return (g: Guest) => m.get(g.household_id) ?? ''
  }, [households])

  const sideOfGuest = useMemo(() => {
    const m = new Map(households.map(h => [h.id, h.side]))
    return (g: Guest) => m.get(g.household_id) ?? null
  }, [households])

  const attendingIds = useMemo(() => {
    const s = new Set<string>()
    for (const r of rsvps) if (r.attending && r.guest_id) s.add(r.guest_id)
    return s
  }, [rsvps])

  const tableOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of assignments) m.set(a.guest_id, a.table_id)
    return m
  }, [assignments])

  const seatedByTable = useMemo(() => {
    const m = new Map<string, Guest[]>()
    for (const g of guests) {
      const t = tableOf.get(g.id)
      if (!t) continue
      const list = m.get(t) ?? []; list.push(g); m.set(t, list)
    }
    return m
  }, [guests, tableOf])

  // Unseated tray. Defaults to confirmed attendees only — seating someone who
  // has declined is the most common way a chart goes wrong.
  // 'Both' households show up under either side — they belong to the couple, so
  // filtering to one family should not hide them.
  const unseated = useMemo(
    () => guests.filter(g => {
      if (tableOf.has(g.id)) return false
      if (attendingOnly && !attendingIds.has(g.id)) return false
      if (sideFilter === 'all') return true
      const side = sideOfGuest(g)
      return side === sideFilter || side === 'both'
    }),
    [guests, tableOf, attendingOnly, attendingIds, sideFilter, sideOfGuest],
  )

  const { setNodeRef: trayRef, isOver: overTray } = useDroppable({ id: 'tray' })

  /**
   * `tables.length` is stale until load() resolves, so a second click (or a
   * held-down Enter key) before that round trip finishes reused the same
   * index and stacked two tables on the exact same pixel — indistinguishable
   * on the canvas, and undeletable through the UI, since selecting one always
   * hit whichever sat on top. addingTable blocks re-entry until the request
   * that reads `i` has actually landed.
   */
  async function addTable(e: React.FormEvent) {
    e.preventDefault()
    if (addingTable) return
    setAddingTable(true)
    const name = newName.trim() || `Table ${tables.length + 1}`
    // Lay new tables out in a grid so they never land on top of each other.
    const i = tables.length
    const row = await insertRow<WeddingTable>('wedding_tables', {
      name, shape: newShape, capacity: newCap,
      pos_x: 60 + (i % 5) * 270, pos_y: 60 + Math.floor(i / 5) * 260,
    }, 'add table')
    if (row) setNewName('')
    await load()
    setAddingTable(false)
  }

  async function moveTable(id: string, x: number, y: number) {
    const clampedX = Math.max(0, Math.min(CANVAS_W - 240, x))
    const clampedY = Math.max(0, Math.min(CANVAS_H - 200, y))
    setTables(ts => ts.map(t => (t.id === id ? { ...t, pos_x: clampedX, pos_y: clampedY } : t)))
    // Persist on every move would be a write per pixel; the pointer-up commit
    // calls this with the already-current position, which is the one that lands.
    await updateRow('wedding_tables', id, { pos_x: clampedX, pos_y: clampedY }, 'move table')
  }

  async function removeTable(id: string) {
    // Assignments cascade, so the guests simply return to the tray.
    if (await deleteRow('wedding_tables', id, 'remove table')) { setSelected(null); load() }
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id).replace('guest:', '')
    setDragging(guests.find(g => g.id === id) ?? null)
  }

  async function onDragEnd(e: DragEndEvent) {
    setDragging(null)
    const guestId = String(e.active.id).replace('guest:', '')
    const over = e.over?.id ? String(e.over.id) : null
    if (!over) return

    const existing = assignments.find(a => a.guest_id === guestId)

    if (over === 'tray') {
      if (existing && await deleteRow('wedding_seat_assignments', existing.id, 'unseat guest')) load()
      return
    }
    const tableId = over.replace('table:', '')
    if (existing?.table_id === tableId) return

    if (existing) {
      if (await updateRow('wedding_seat_assignments', existing.id, { table_id: tableId }, 'move guest')) load()
    } else {
      if (await insertRow<SeatAssignment>('wedding_seat_assignments',
        { table_id: tableId, guest_id: guestId }, 'seat guest')) load()
    }
  }

  if (loading) return <div className="max-w-[1200px] mx-auto px-6 py-12"><Empty>Loading…</Empty></div>

  const selectedTable = tables.find(t => t.id === selected)

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <PageHeader
          title="Seating"
          action={
            <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-500">
              {assignments.length} seated · {unseated.length} to place
            </span>
          }
        />

        <form onSubmit={addTable} className="flex flex-wrap gap-2 mb-6 items-center">
          <TextInput placeholder="Table name…" value={newName} onChange={e => setNewName(e.target.value)} />
          <Select value={newShape} onChange={e => setNewShape(e.target.value as 'round' | 'rect')}>
            <option value="round">Round</option>
            <option value="rect">Long</option>
          </Select>
          <TextInput
            type="number" min={1} max={30} value={newCap}
            onChange={e => setNewCap(Number(e.target.value) || 8)} className="w-20"
          />
          <Btn variant="primary" type="submit" disabled={addingTable}>
            {addingTable ? 'Adding…' : 'Add table'}
          </Btn>
          {selectedTable && (
            <Btn variant="danger" onClick={() => removeTable(selectedTable.id)}>
              Delete {selectedTable.name}
            </Btn>
          )}
        </form>

        <div className="grid lg:grid-cols-[1fr_260px] gap-6">
          {/* Floor plan */}
          <div className="border border-zinc-800 rounded-[2px] bg-[#070707] overflow-auto">
            <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
              {tables.length === 0 && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-600">
                  Add a table to start the floor plan.
                </p>
              )}
              {tables.map(t => (
                <TableNode
                  key={t.id}
                  table={t}
                  seated={seatedByTable.get(t.id) ?? []}
                  onMove={moveTable}
                  onSelect={setSelected}
                  selected={selected === t.id}
                />
              ))}
            </div>
          </div>

          {/* Unseated tray */}
          <div
            ref={trayRef}
            className={
              'border rounded-[2px] p-4 h-fit sticky top-4 transition-colors ' +
              (overTray ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 bg-zinc-950')
            }
          >
            <Label>To seat ({unseated.length})</Label>
            <label className="flex items-center gap-2 mb-4 text-[10px] tracking-[0.15em] uppercase text-zinc-500 cursor-pointer">
              <input
                type="checkbox"
                checked={attendingOnly}
                onChange={e => setAttendingOnly(e.target.checked)}
              />
              Attending only
            </label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {([['all', 'All'], ['bride', SIDE_LABEL.bride], ['groom', SIDE_LABEL.groom]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSideFilter(key)}
                  className={
                    'text-[10px] tracking-[0.15em] uppercase px-2 py-1 rounded-[2px] border transition-colors ' +
                    (sideFilter === key
                      ? 'border-zinc-500 text-zinc-50'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unseated.length === 0
                ? <p className="text-xs text-zinc-600">Everyone is seated.</p>
                : unseated.map(g => (
                    <div key={g.id} title={householdName(g)}>
                      <DraggableGuest guest={g} />
                    </div>
                  ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
              Drag a name onto a table to seat them. Drag back here to unseat.
              Drag a table to move it. A dashed outline marks a child.
            </p>
          </div>
        </div>
      </div>

      <DragOverlay>{dragging ? <GuestChip guest={dragging} /> : null}</DragOverlay>
    </DndContext>
  )
}

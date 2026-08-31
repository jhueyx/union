// Pure date helpers — no Supabase import, safe to use from the public site
// (unlike planning.ts, which is admin-only; see its header comment). The
// planner re-exports this module so existing admin imports keep working.
//
// Everything here works in whole local days on bare 'YYYY-MM-DD' strings.
// `new Date('2027-05-08')` parses as UTC midnight, which reads as the previous
// day anywhere west of Greenwich — the reason a countdown can sit one day off
// all afternoon. Parsing the parts by hand keeps it in local time.

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

export function toISODay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Whole days from today to `iso`. Negative once it is in the past. */
export function daysUntil(iso: string): number {
  return Math.round((parseDay(iso).getTime() - today().getTime()) / 86_400_000)
}

/** `iso` shifted by `days`, as another ISO day string. */
export function shiftDay(iso: string, days: number): string {
  const d = parseDay(iso)
  d.setDate(d.getDate() + days)
  return toISODay(d)
}

/** "in 8 months" / "in 3 weeks" / "tomorrow" / "6 days ago". */
export function relativeDay(iso: string): string {
  const n = daysUntil(iso)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  const ago = n < 0
  const a = Math.abs(n)
  const [value, unit] =
    a < 21 ? [a, 'day'] :
    a < 60 ? [Math.round(a / 7), 'week'] :
    a < 365 ? [Math.round(a / 30), 'month'] :
    [Math.round(a / 30) / 12, 'year']
  const rounded = unit === 'year' ? Math.round(value * 10) / 10 : value
  const plural = rounded === 1 ? '' : 's'
  return ago ? `${rounded} ${unit}${plural} ago` : `in ${rounded} ${unit}${plural}`
}

/** "Saturday, May 8, 2027" from a bare day string. */
export function formatDay(iso: string): string {
  return parseDay(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

/** "10 · 11 · 27" — the Hero's short date, from a bare day string. */
export function formatDayShort(iso: string): string {
  const d = parseDay(iso)
  return `${d.getMonth() + 1} · ${d.getDate()} · ${String(d.getFullYear()).slice(2)}`
}

/** "17:00" or "17:00:00" (what Postgres hands back for `time`) -> "5:00 PM". */
export function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h = Number(hStr), m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return t
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

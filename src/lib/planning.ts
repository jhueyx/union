// Data access for the wedding planning suite.
//
// Every table here is admin-only (RLS requires an authenticated session), which
// is why nothing in this module is used outside /admin.
import { supabase } from './supabase'

export type TableShape = 'round' | 'rect'
/**
 * Which family a household belongs to. Null while it is undecided; 'both' is
 * for the people the couple share, who belong to neither list alone.
 */
export type Side = 'bride' | 'groom' | 'both'
export type VendorStatus = 'considering' | 'booked' | 'declined'

export interface WeddingTable {
  id: string
  name: string
  shape: TableShape
  capacity: number
  pos_x: number
  pos_y: number
  rotation: number
  notes: string | null
}

export interface SeatAssignment {
  id: string
  table_id: string
  guest_id: string
  seat_index: number | null
}

export interface Guest {
  id: string
  household_id: string
  first_name: string
  last_name: string
  /** Children are counted and catered for separately from adults. */
  is_child: boolean
}

export interface Household {
  id: string
  name: string
  /** Null until the invitation is actually sent — see Guests page. */
  invite_code: string | null
  max_guests: number
  notes: string | null
  side: Side | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  /** When the invitation actually went out. Minting a code is a separate act. */
  invitation_sent_at: string | null
}

/** A household's address as lines, empty when nothing has been entered. */
export function addressLines(h: Household): string[] {
  const cityLine = [h.city, h.state].filter(Boolean).join(', ')
  return [
    h.address_line1,
    h.address_line2,
    [cityLine, h.postal_code].filter(Boolean).join(' ').trim(),
    h.country,
  ].map(l => (l ?? '').trim()).filter(Boolean)
}

export function hasAddress(h: Household): boolean {
  return Boolean(h.address_line1?.trim())
}

/**
 * Invite code: 6 characters from an alphabet with no O/0 or I/1, so it can be
 * read aloud or typed off a printed invitation without ambiguity.
 */
export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

export interface RsvpResponse {
  guest_id: string | null
  household_id: string
  attending: boolean | null
  meal_choice_id: string | null
  dietary_restrictions: string | null
  song_request: string | null
  notes: string | null
}

export interface WeddingTask {
  id: string
  title: string
  category: string | null
  due_date: string | null
  done: boolean
  position: number
  notes: string | null
}

export interface TimelineEvent {
  id: string
  title: string
  starts_at: string | null
  duration_minutes: number | null
  location: string | null
  owner: string | null
  notes: string | null
  position: number
}

export interface Vendor {
  id: string
  name: string
  category: string | null
  status: VendorStatus
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  notes: string | null
}

export interface BudgetItem {
  id: string
  label: string
  category: string | null
  estimated: number
  actual: number | null
  paid: boolean
  due_date: string | null
  vendor_id: string | null
  notes: string | null
}

/**
 * Supabase reports failures in the result rather than throwing, so a caller
 * that only reads `data` never learns a write was rejected. Everything here
 * routes through these helpers so a failure always surfaces.
 */
let reportError: ((message: string) => void) | null = null
export function setPlanningErrorReporter(fn: ((message: string) => void) | null) {
  reportError = fn
}

function fail(action: string, message: string) {
  console.error(`[union] ${action} failed:`, message)
  reportError?.(`Couldn't ${action} — ${message}`)
}

export async function fetchAll<T>(table: string, order?: string): Promise<T[]> {
  let q = supabase.from(table).select('*')
  if (order) q = q.order(order, { ascending: true })
  const { data, error } = await q
  if (error) { fail(`load ${table.replace('wedding_', '')}`, error.message); return [] }
  return (data ?? []) as T[]
}

// Payloads are plain records rather than Partial<T>: supabase-js's generics
// reject an unresolved Partial<T>, and the call sites are already typed by the
// interfaces above.
export type RowPatch = Record<string, unknown>

export async function insertRow<T>(table: string, row: RowPatch, action: string): Promise<T | null> {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) { fail(action, error.message); return null }
  return data as T
}

/** Bulk insert — one round trip rather than one per row, same failure reporting. */
export async function insertRows(table: string, rows: RowPatch[], action: string): Promise<boolean> {
  if (rows.length === 0) return true
  const { error } = await supabase.from(table).insert(rows)
  if (error) { fail(action, error.message); return false }
  return true
}

export async function updateRow(table: string, id: string, patch: RowPatch, action: string): Promise<boolean> {
  const { error } = await supabase.from(table).update(patch).eq('id', id)
  if (error) { fail(action, error.message); return false }
  return true
}

export async function deleteRow(table: string, id: string, action: string): Promise<boolean> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) { fail(action, error.message); return false }
  return true
}

/** Display labels for the sides. Undecided households render as "Unassigned". */
export const SIDE_LABEL: Record<Side, string> = {
  bride: 'Bride',
  groom: 'Groom',
  both: 'Both',
}

/** Money formatting used across budget views. */
export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// ── Settings ────────────────────────────────────────────────────────────────

/** One row, id = true. See the wedding_settings migration. */
export interface WeddingSettings {
  id: boolean
  wedding_date: string | null
  ceremony_time: string | null
  venue_name: string | null
  venue_address: string | null
  rsvp_deadline: string | null
  guest_target: number | null
  notes: string | null
  updated_at?: string
}

export interface MealOption {
  id: string
  label: string
  description: string | null
  dietary_tags: string[]
  is_child_meal: boolean
  position: number
}

export async function fetchSettings(): Promise<WeddingSettings | null> {
  const { data, error } = await supabase.from('wedding_settings').select('*').eq('id', true).maybeSingle()
  if (error) { fail('load settings', error.message); return null }
  return data as WeddingSettings | null
}

export async function saveSettings(patch: RowPatch): Promise<boolean> {
  const { error } = await supabase
    .from('wedding_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) { fail('save settings', error.message); return false }
  return true
}

// ── Dates ───────────────────────────────────────────────────────────────────
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

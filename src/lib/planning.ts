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

/**
 * Reserves a household's not-yet-named seats at a table as a single block,
 * for seating a household before its guests have names. `household_id` is
 * unique — a household's unnamed block lives at one table at a time. How
 * many seats it represents isn't stored here; it's `household.max_guests`
 * minus however many of that household's guests already have real rows, so
 * it shrinks on its own as names get added and never goes stale.
 */
export interface UnnamedSeatBlock {
  id: string
  household_id: string
  table_id: string
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

export type SiteMode = 'coming-soon' | 'live'

/** One row, id = true. See the wedding_settings migration. */
export interface WeddingSettings {
  id: boolean
  wedding_date: string | null
  ceremony_time: string | null
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_maps_url: string | null
  dress_code: string | null
  couple_names: string
  rsvp_deadline: string | null
  guest_target: number | null
  notes: string | null
  /** One fixed banquet menu for everyone — skips the per-guest meal-choice
   *  step in RSVP, which assumes Western plated service by default. */
  single_menu: boolean
  /** Gates the public site — 'coming-soon' shows the landing page only, no
   *  nav; 'live' shows the full site. Flipping this needs no deploy. */
  site_mode: SiteMode
  /** Coming-soon landing copy, one paragraph per line. Null falls back to the
   *  default copy baked into Hero.tsx. */
  coming_soon_message: string | null
  /** Gifts page copy. Null falls back to the default copy baked into
   *  RegistryPage.tsx. No registry links — see DEFAULT_GIFT_MESSAGE. */
  gift_message: string | null
  /** Keyed by nav route path (e.g. "/story"). A path missing from this object
   *  is visible — default-on, so adding a column changed nothing until
   *  someone actually unchecks a page. */
  nav_visibility: Record<string, boolean>
  /** Storage path in the wedding-photos bucket, not a resolved URL — see
   *  src/lib/photos.ts. */
  story_photo_path: string | null
  save_the_date_photo_path: string | null
  updated_at?: string
}

// ── Public site content ──────────────────────────────────────────────────
// One table per guest-facing page — these used to be static arrays in
// src/data/mock.ts, which meant editing them needed a code deploy. Public
// SELECT + admin-only write, same as wedding_meals.

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: string | null
  position: number
}

export interface TravelItem {
  id: string
  type: 'hotel' | 'transport' | 'activity' | 'restaurant'
  name: string
  address: string | null
  url: string | null
  note: string | null
  price_range: string | null
  booking_code: string | null
  position: number
}

/** The guest-facing schedule (/schedule, /invitation) — distinct from
 *  wedding_timeline, the internal day-of running order, which can carry
 *  vendor call times and other detail not meant for guests. */
export interface PublicEvent {
  id: string
  name: string
  time_label: string
  end_time_label: string | null
  location: string | null
  address: string | null
  description: string | null
  dresscode: string | null
  position: number
}

/** One section of Our Story (/story) — heading + body, in display order. */
export interface StoryItem {
  id: string
  heading: string
  body: string
  position: number
}

/** One photo in the /photos gallery — storage_path resolves via photoUrl(). */
export interface PhotoItem {
  id: string
  storage_path: string
  caption: string | null
  position: number
}

/** Public guestbook entry — anyone can insert or read; delete is admin-only
 *  moderation. See wedding_guestbook migration. */
export interface GuestbookEntry {
  id: string
  name: string
  message: string
  created_at: string
}

export interface WeddingGift {
  id: string
  household_id: string | null
  /** Fallback label when the giver isn't in the guest list. */
  given_by: string | null
  amount: number | null
  currency: string
  note: string | null
  received_at: string | null
}

/** Table size assumed when no floor plan exists yet to average from. */
export const DEFAULT_TABLE_SIZE = 10

/** How many banquet tables `seats` needs, from the actual floor plan if one
 *  exists (averaging its tables' capacity) or the banquet-standard default. */
export function tablesNeeded(seats: number, tables: { capacity: number }[]): number {
  const size = tables.length
    ? tables.reduce((n, t) => n + (t.capacity || 0), 0) / tables.length
    : DEFAULT_TABLE_SIZE
  return size > 0 ? Math.ceil(seats / size) : 0
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
// Moved to dates.ts so the public site can use them too — this module is
// admin-only (see the header comment). Re-exported here so existing imports
// throughout the admin pages don't need to change.
export * from './dates'

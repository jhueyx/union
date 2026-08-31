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

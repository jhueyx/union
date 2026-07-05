// Union — utility helpers for dates, lookups, and admin stats.

import type {
  Household,
  Guest,
  RSVPResponse,
  AdminStats,
  SongRequest,
} from '../types'

// Countdown to a target ISO date. Returns null if the date is missing/passed.
export function getCountdown(
  targetDate: string
): { days: number; hours: number; minutes: number; seconds: number } | null {
  if (!targetDate) return null
  const target = new Date(targetDate).getTime()
  if (Number.isNaN(target)) return null

  const diff = target - Date.now()
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds }
}

// Format an ISO date string into a friendly long form.
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Find a household by its invite code (case-insensitive).
export function findHouseholdByCode(
  code: string,
  households: Household[]
): Household | undefined {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return undefined
  return households.find((h) => h.inviteCode.toUpperCase() === normalized)
}

// Return the guests belonging to a household.
export function getHouseholdGuests(
  household: Household,
  guests: Guest[]
): Guest[] {
  return guests.filter((g) => household.guestIds.includes(g.id))
}

// Compute aggregate stats for the admin dashboard.
export function computeAdminStats(
  _households: Household[],
  guests: Guest[],
  rsvps: RSVPResponse[]
): AdminStats {
  const totalInvited = guests.length

  // A guest is "responded" if they appear in an RSVP row.
  const respondedGuestIds = new Set(rsvps.map((r) => r.guestId))
  const rsvpReceived = respondedGuestIds.size

  const attending = rsvps.filter((r) => r.attending).length
  const notAttending = rsvps.filter((r) => !r.attending).length
  const pending = totalInvited - rsvpReceived

  const mealCounts: Record<string, number> = {}
  const dietaryFlags: string[] = []
  const songRequests: SongRequest[] = []

  const guestById = new Map(guests.map((g) => [g.id, g]))

  for (const r of rsvps) {
    if (r.attending && r.mealChoiceId) {
      mealCounts[r.mealChoiceId] = (mealCounts[r.mealChoiceId] ?? 0) + 1
    }

    if (r.dietaryRestrictions && r.dietaryRestrictions.trim()) {
      const guest = guestById.get(r.guestId)
      const who = guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'
      dietaryFlags.push(`${who}: ${r.dietaryRestrictions.trim()}`)
    }

    if (r.songRequest && r.songRequest.trim()) {
      const guest = guestById.get(r.guestId)
      const guestName = guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'
      songRequests.push({
        householdId: r.householdId,
        guestName,
        song: r.songRequest.trim(),
      })
    }
  }

  return {
    totalInvited,
    rsvpReceived,
    attending,
    notAttending,
    pending,
    mealCounts,
    dietaryFlags,
    songRequests,
  }
}

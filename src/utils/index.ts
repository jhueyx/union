// Union — utility helpers for dates and formatting.

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

// Generate a random 6-character invite code.
export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Union — save the date page with live countdown and share/calendar actions.
import { useState } from 'react'
import { WEDDING, WEDDING_DATE } from '../config'
import CountdownTimer from '../components/CountdownTimer'
import Button from '../components/ui/Button'

function buildGoogleCalendarUrl(): string | null {
  if (!WEDDING_DATE) return null
  const start = new Date(WEDDING_DATE)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000) // assume ~6h
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Sally & Jason — Wedding',
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'We can’t wait to celebrate with you!',
    location: WEDDING.venue.name || WEDDING.venue.city || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function SaveTheDate() {
  const [shareMsg, setShareMsg] = useState('')
  const calendarUrl = buildGoogleCalendarUrl()

  const handleShare = async () => {
    const url = window.location.href
    const shareData = {
      title: 'Sally & Jason',
      text: 'Save the date for Sally & Jason’s wedding!',
      url,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setShareMsg('Link copied to clipboard.')
        setTimeout(() => setShareMsg(''), 2500)
      } catch {
        setShareMsg('Copy this link: ' + url)
      }
    }
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
        Save the Date
      </p>

      <h1
        className="text-5xl md:text-7xl text-zinc-900 dark:text-zinc-50 mb-6"
        style={{ fontFamily: "'Great Vibes', cursive", lineHeight: 1.1 }}
      >
        Sally &amp; Jason
      </h1>

      <p className="text-lg font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-2">
        {WEDDING.date || 'Date to be announced'}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-14">
        {WEDDING.venue.city || 'Location to be announced'}
      </p>

      {/* Engagement photo placeholder */}
      <div
        className="mx-auto mb-14 max-w-[420px] aspect-[4/3] rounded-[2px] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300 dark:text-zinc-700">
          Photo Coming Soon
        </span>
      </div>

      <div className="mb-14 flex justify-center">
        <CountdownTimer targetDate={WEDDING_DATE} />
      </div>

      <p className="italic text-sm text-zinc-400 dark:text-zinc-500 mb-12">
        Formal invitation to follow.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {calendarUrl && (
          <Button variant="primary" size="md" href={calendarUrl} external>
            Add to Calendar
          </Button>
        )}
        <Button variant="secondary" size="md" onClick={handleShare}>
          Share
        </Button>
      </div>

      {shareMsg && (
        <p className="mt-5 text-xs text-zinc-400 dark:text-zinc-600 tracking-wide">
          {shareMsg}
        </p>
      )}
    </div>
  )
}

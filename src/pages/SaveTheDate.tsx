// Union — save the date page with live countdown and share/calendar actions.
import { useState } from 'react'
import { useSiteContent, type WeddingDisplay } from '../lib/siteContent'
import CountdownTimer from '../components/CountdownTimer'
import Button from '../components/ui/Button'

function buildGoogleCalendarUrl(wedding: WeddingDisplay): string | null {
  if (!wedding.dateTimeISO) return null
  const start = new Date(wedding.dateTimeISO)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000) // assume ~6h
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${wedding.coupleNames} — Wedding`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'We can’t wait to celebrate with you!',
    location: wedding.venue.name || wedding.venue.city || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function SaveTheDate() {
  const { wedding } = useSiteContent()
  const [shareMsg, setShareMsg] = useState('')
  const calendarUrl = buildGoogleCalendarUrl(wedding)

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
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-8">
        Save the Date
      </p>

      <h1
        className="text-5xl md:text-7xl text-zinc-900 mb-6"
        style={{ fontFamily: "'Great Vibes', cursive", lineHeight: 1.1 }}
      >
        Sally &amp; Jason
      </h1>

      <p className="text-lg font-[300] tracking-[0.08em] text-zinc-900 mb-2">
        {wedding.date || 'Date to be announced'}
      </p>
      <p className="text-sm text-zinc-500 mb-14">
        {wedding.venue.city || 'Location to be announced'}
      </p>

      {/* Engagement photo */}
      {wedding.saveTheDatePhotoUrl ? (
        <img
          src={wedding.saveTheDatePhotoUrl}
          alt=""
          className="mx-auto mb-14 max-w-[420px] w-full aspect-[4/3] object-cover rounded-[2px]"
        />
      ) : (
        <div
          className="mx-auto mb-14 max-w-[420px] aspect-[4/3] rounded-[2px] border border-zinc-200 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-600">
            Photo Coming Soon
          </span>
        </div>
      )}

      <div className="mb-14 flex justify-center">
        <CountdownTimer targetDate={wedding.dateTimeISO} />
      </div>

      <p className="italic text-sm text-zinc-600 mb-12">
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
        <p className="mt-5 text-xs text-zinc-600 tracking-wide">
          {shareMsg}
        </p>
      )}
    </div>
  )
}

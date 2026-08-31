// Live content for the public site — wedding_settings plus the four
// guest-facing content tables (wedding_faq, wedding_travel, wedding_registry,
// wedding_events). All four used to be static arrays in src/data/mock.ts and
// a WEDDING object in src/config.ts, which meant every content change needed
// a code deploy. This fetches once at the RootLayout root and hands it down
// through context so no page component below it needs its own fetch/loading
// dance.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import { formatDay, formatDayShort, formatTime } from './dates'

export type SiteMode = 'coming-soon' | 'live'

interface SettingsRow {
  site_mode: SiteMode
  wedding_date: string | null
  ceremony_time: string | null
  couple_names: string
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_maps_url: string | null
  dress_code: string | null
  rsvp_deadline: string | null
}

export interface FaqItem { id: string; question: string; answer: string; category: string | null }
export interface TravelItem {
  id: string; type: string; name: string; address: string | null; url: string | null
  note: string | null; price_range: string | null; booking_code: string | null
}
export interface RegistryItem { id: string; store: string; url: string; note: string | null }
export interface PublicEvent {
  id: string; name: string; time_label: string; end_time_label: string | null
  location: string | null; address: string | null; description: string | null; dresscode: string | null
}

/** Formatted, display-ready wedding details — shaped to match the old
 *  config.ts WEDDING object closely, so components barely change. */
export interface WeddingDisplay {
  coupleNames: string
  date: string
  dateShort: string
  time: string
  /** Combined date + time as an ISO-ish string CountdownTimer/getCountdown
   *  can parse, e.g. '2027-05-08T17:00:00'. Empty if no date is set. */
  dateTimeISO: string
  rsvpDeadline: string
  dressCode: string
  venue: { name: string; address: string; city: string; mapsUrl: string }
}

interface SiteContent {
  isLive: boolean
  wedding: WeddingDisplay
  events: PublicEvent[]
  travel: TravelItem[]
  registry: RegistryItem[]
  faq: FaqItem[]
}

const EMPTY_WEDDING: WeddingDisplay = {
  coupleNames: 'Sally & Jason', date: '', dateShort: '', time: '', dateTimeISO: '',
  rsvpDeadline: '', dressCode: '', venue: { name: '', address: '', city: '', mapsUrl: '' },
}

const FALLBACK: SiteContent = {
  isLive: false, wedding: EMPTY_WEDDING, events: [], travel: [], registry: [], faq: [],
}

function toDisplay(s: SettingsRow | null): WeddingDisplay {
  if (!s) return EMPTY_WEDDING
  return {
    coupleNames: s.couple_names || EMPTY_WEDDING.coupleNames,
    date: s.wedding_date ? formatDay(s.wedding_date) : '',
    dateShort: s.wedding_date ? formatDayShort(s.wedding_date) : '',
    time: s.ceremony_time ? formatTime(s.ceremony_time) : '',
    dateTimeISO: s.wedding_date ? `${s.wedding_date}T${s.ceremony_time ?? '00:00'}` : '',
    rsvpDeadline: s.rsvp_deadline ? formatDay(s.rsvp_deadline) : '',
    dressCode: s.dress_code ?? '',
    venue: {
      name: s.venue_name ?? '',
      address: s.venue_address ?? '',
      city: s.venue_city ?? '',
      mapsUrl: s.venue_maps_url ?? '',
    },
  }
}

const SiteContentContext = createContext<SiteContent | null>(null)

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('wedding_settings').select('*').eq('id', true).maybeSingle(),
      supabase.from('wedding_events').select('*').order('position'),
      supabase.from('wedding_travel').select('*').order('position'),
      supabase.from('wedding_registry').select('*').order('position'),
      supabase.from('wedding_faq').select('*').order('position'),
    ]).then(([settings, events, travel, registry, faq]) => {
      const row = (settings.data as SettingsRow | null) ?? null
      setContent({
        isLive: row?.site_mode === 'live',
        wedding: toDisplay(row),
        events: (events.data ?? []) as PublicEvent[],
        travel: (travel.data ?? []) as TravelItem[],
        registry: (registry.data ?? []) as RegistryItem[],
        faq: (faq.data ?? []) as FaqItem[],
      })
    }).catch(() => setContent(FALLBACK))
  }, [])

  // Blank while loading — mirrors AdminLayout's session gate. Without this a
  // visitor briefly sees the coming-soon fallback (or a flash of stale
  // content) before the real site_mode lands a moment later.
  if (!content) return null

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
}

export function useSiteContent(): SiteContent {
  const ctx = useContext(SiteContentContext)
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider')
  return ctx
}

// Live content for the public site — wedding_settings plus three
// guest-facing content tables (wedding_faq, wedding_travel,
// wedding_events). These used to be static arrays in src/data/mock.ts and
// a WEDDING object in src/config.ts, which meant every content change needed
// a code deploy. This fetches once at the RootLayout root and hands it down
// through context so no page component below it needs its own fetch/loading
// dance. The Gifts page has no table of its own — its copy is just
// wedding_settings.gift_message, see DEFAULT_GIFT_MESSAGE below.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import { formatDay, formatDayShort, formatTime } from './dates'
import { photoUrl } from './photos'

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
  coming_soon_message: string | null
  nav_visibility: Record<string, boolean> | null
  story_photo_path: string | null
  save_the_date_photo_path: string | null
  gift_message: string | null
}

/** The nav's fixed set of links — shared with /admin/settings so the page
 *  visibility checklist there can't drift from what Nav.tsx actually renders. */
export const NAV_LINKS = [
  { label: 'Our Story', to: '/story' },
  { label: 'Save the Date', to: '/save-the-date' },
  { label: 'Invite', to: '/invitation' },
  { label: 'RSVP', to: '/rsvp' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Travel', to: '/travel' },
  { label: 'Gifts', to: '/registry' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Guestbook', to: '/guestbook' },
]

/** The copy Hero.tsx always showed before this was editable. Still the
 *  fallback when coming_soon_message is unset. */
export const DEFAULT_COMING_SOON_MESSAGE = [
  "We're looking forward to celebrating with the people who matter most.",
  'Our wedding website is currently being prepared as we finalize the details.',
  "We'll share everything here soon.",
]

/** The copy RegistryPage.tsx always showed before this was editable. Still
 *  the fallback when gift_message is unset. */
export const DEFAULT_GIFT_MESSAGE =
  'Your presence at our celebration is the greatest gift of all. Should you ' +
  'wish to give something more, a contribution toward our future together ' +
  'would be warmly appreciated.'

export interface FaqItem { id: string; question: string; answer: string; category: string | null }
export interface TravelItem {
  id: string; type: string; name: string; address: string | null; url: string | null
  note: string | null; price_range: string | null; booking_code: string | null
}
export interface PublicEvent {
  id: string; name: string; time_label: string; end_time_label: string | null
  location: string | null; address: string | null; description: string | null; dresscode: string | null
}
export interface StoryItem { id: string; heading: string; body: string }
export interface PhotoItem { id: string; url: string; caption: string | null }

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
  storyPhotoUrl: string | null
  saveTheDatePhotoUrl: string | null
}

interface SiteContent {
  isLive: boolean
  wedding: WeddingDisplay
  /** Coming-soon landing paragraphs — DEFAULT_COMING_SOON_MESSAGE unless
   *  customized in /admin/settings. */
  comingSoonMessage: string[]
  /** Gifts page copy — DEFAULT_GIFT_MESSAGE unless customized at
   *  /admin/content. */
  giftMessage: string
  /** True unless this path was explicitly turned off in /admin/settings. */
  isNavVisible: (path: string) => boolean
  events: PublicEvent[]
  travel: TravelItem[]
  faq: FaqItem[]
  story: StoryItem[]
  photos: PhotoItem[]
}

const EMPTY_WEDDING: WeddingDisplay = {
  coupleNames: 'Sally & Jason', date: '', dateShort: '', time: '', dateTimeISO: '',
  rsvpDeadline: '', dressCode: '', venue: { name: '', address: '', city: '', mapsUrl: '' },
  storyPhotoUrl: null, saveTheDatePhotoUrl: null,
}

const FALLBACK: SiteContent = {
  isLive: false, wedding: EMPTY_WEDDING, comingSoonMessage: DEFAULT_COMING_SOON_MESSAGE,
  giftMessage: DEFAULT_GIFT_MESSAGE,
  isNavVisible: () => true,
  events: [], travel: [], faq: [], story: [], photos: [],
}

function toComingSoonMessage(s: SettingsRow | null): string[] {
  const lines = s?.coming_soon_message?.split('\n').map(l => l.trim()).filter(Boolean)
  return lines?.length ? lines : DEFAULT_COMING_SOON_MESSAGE
}

function toGiftMessage(s: SettingsRow | null): string {
  return s?.gift_message?.trim() || DEFAULT_GIFT_MESSAGE
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
    storyPhotoUrl: photoUrl(s.story_photo_path),
    saveTheDatePhotoUrl: photoUrl(s.save_the_date_photo_path),
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
      supabase.from('wedding_faq').select('*').order('position'),
      supabase.from('wedding_story').select('*').order('position'),
      supabase.from('wedding_photos').select('*').order('position'),
    ]).then(([settings, events, travel, faq, story, photos]) => {
      const row = (settings.data as SettingsRow | null) ?? null
      const hidden = row?.nav_visibility ?? {}
      setContent({
        isLive: row?.site_mode === 'live',
        wedding: toDisplay(row),
        comingSoonMessage: toComingSoonMessage(row),
        giftMessage: toGiftMessage(row),
        isNavVisible: path => hidden[path] !== false,
        events: (events.data ?? []) as PublicEvent[],
        travel: (travel.data ?? []) as TravelItem[],
        faq: (faq.data ?? []) as FaqItem[],
        story: (story.data ?? []) as StoryItem[],
        photos: ((photos.data ?? []) as { id: string; storage_path: string; caption: string | null }[])
          .map(p => ({ id: p.id, url: photoUrl(p.storage_path) as string, caption: p.caption })),
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

// Union — internal codename for sallyjason.com

import type { SitePhase } from './types'

export type SiteMode = 'coming-soon' | 'live'

// Change to 'live' to reveal the full site. One line ships the whole thing.
export const SITE_MODE: SiteMode = 'coming-soon'

// The current phase of the wedding journey. Advance as the day approaches.
// Change to 'save-the-date', 'invitation', etc. as the wedding approaches.
export const SITE_PHASE: SitePhase = 'coming-soon'

// Wedding date for countdown — set when confirmed.
// ISO string, e.g. '2026-10-11T17:00:00'
export const WEDDING_DATE = ''

export const WEDDING = {
  coupleNames: 'Sally & Jason',

  // Fill these in as details are confirmed.
  date: '',         // e.g. 'Saturday, October 11, 2025'
  dateShort: '',    // e.g. '10 · 11 · 25'
  time: '',         // e.g. '5:00 PM'
  rsvpDeadline: '', // e.g. 'September 1, 2025'
  dressCode: '',    // e.g. 'Black Tie Optional'

  venue: {
    name: '',
    address: '',
    city: '',
    mapsUrl: '', // Google Maps share URL
  },

  schedule: [] as Array<{
    time: string
    event: string
    note?: string
  }>,

  hotels: [] as Array<{
    name: string
    address: string
    bookingUrl: string
    note: string
  }>,

  registry: [] as Array<{
    store: string
    url: string
  }>,
}

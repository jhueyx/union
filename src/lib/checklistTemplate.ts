// The standard wedding checklist, expressed as offsets from the wedding day.
//
// The Checklist page had zero rows for a reason: it opened empty and expected
// you to recall sixty standard tasks from memory. Nobody does that, so nobody
// used it. Seeding from the date turns it into something you edit rather than
// something you author.
//
// `days` is how far BEFORE the wedding the task is due, so the whole list
// rebases automatically if the date moves.

export interface TemplateTask {
  /** Days before the wedding. */
  days: number
  title: string
  category: string
}

const MONTH = 30

export const CHECKLIST_TEMPLATE: TemplateTask[] = [
  // ── 12 months ──
  { days: 12 * MONTH, title: 'Agree the overall budget', category: 'Other' },
  { days: 12 * MONTH, title: 'Draft the guest list and rough headcount', category: 'Other' },
  { days: 12 * MONTH, title: 'Choose the wedding date', category: 'Venue' },
  { days: 12 * MONTH, title: 'Tour and book the ceremony venue', category: 'Venue' },
  { days: 12 * MONTH, title: 'Tour and book the reception venue', category: 'Venue' },

  // ── 10 months ──
  { days: 10 * MONTH, title: 'Book the photographer', category: 'Photos' },
  { days: 10 * MONTH, title: 'Book the videographer', category: 'Photos' },
  { days: 10 * MONTH, title: 'Book the caterer', category: 'Food' },
  { days: 10 * MONTH, title: 'Choose the wedding party', category: 'Other' },

  // ── 9 months ──
  { days: 9 * MONTH, title: 'Book the band or DJ', category: 'Music' },
  { days: 9 * MONTH, title: 'Book the florist', category: 'Flowers' },
  { days: 9 * MONTH, title: 'Start shopping for the wedding dress', category: 'Attire' },
  { days: 9 * MONTH, title: 'Reserve a hotel block for out-of-town guests', category: 'Travel' },

  // ── 8 months ──
  { days: 8 * MONTH, title: 'Book the officiant', category: 'Venue' },
  { days: 8 * MONTH, title: 'Send save-the-dates', category: 'Paper' },
  { days: 8 * MONTH, title: 'Build the wedding website', category: 'Paper' },

  // ── 6 months ──
  { days: 6 * MONTH, title: 'Order the wedding dress', category: 'Attire' },
  { days: 6 * MONTH, title: 'Choose and order bridesmaid dresses', category: 'Attire' },
  { days: 6 * MONTH, title: 'Book transport for the day', category: 'Travel' },
  { days: 6 * MONTH, title: 'Book the cake maker', category: 'Food' },
  { days: 6 * MONTH, title: 'Register for gifts', category: 'Other' },
  { days: 6 * MONTH, title: 'Book the honeymoon', category: 'Travel' },

  // ── 4 months ──
  { days: 4 * MONTH, title: 'Order invitations and stationery', category: 'Paper' },
  { days: 4 * MONTH, title: 'Arrange suits or tuxedos', category: 'Attire' },
  { days: 4 * MONTH, title: 'Plan the ceremony readings and music', category: 'Music' },
  { days: 4 * MONTH, title: 'Check passports are valid for the honeymoon', category: 'Travel' },

  // ── 3 months ──
  { days: 3 * MONTH, title: 'Finalise the menu and book a tasting', category: 'Food' },
  { days: 3 * MONTH, title: 'Order wedding rings', category: 'Attire' },
  { days: 3 * MONTH, title: 'Confirm the day-of timeline with all vendors', category: 'Other' },
  { days: 3 * MONTH, title: 'Book hair and makeup, and a trial', category: 'Attire' },
  { days: 3 * MONTH, title: 'Buy tea ceremony gifts for parents and elders (jewelry, red packets)', category: 'Tea Ceremony' },

  // ── 2 months ──
  { days: 2 * MONTH, title: 'Send the invitations', category: 'Paper' },
  { days: 2 * MONTH, title: 'Apply for the marriage licence', category: 'Other' },
  { days: 2 * MONTH, title: 'First dress fitting', category: 'Attire' },
  { days: 2 * MONTH, title: 'Write the ceremony vows', category: 'Other' },
  { days: 2 * MONTH, title: 'Order favours and place cards', category: 'Paper' },
  { days: 2 * MONTH, title: 'Confirm the tea ceremony order — who pours, who is served first', category: 'Tea Ceremony' },

  // ── 6 weeks ──
  { days: 42, title: 'Chase anyone who has not RSVP’d', category: 'Paper' },
  { days: 42, title: 'Confirm flowers and centrepieces', category: 'Flowers' },
  { days: 42, title: 'Book the rehearsal dinner', category: 'Food' },

  // ── 1 month ──
  { days: MONTH, title: 'Final dress fitting', category: 'Attire' },
  { days: MONTH, title: 'Draft the seating chart', category: 'Other' },
  { days: MONTH, title: 'Confirm the photographer’s shot list', category: 'Photos' },
  { days: MONTH, title: 'Write the speeches', category: 'Other' },
  { days: MONTH, title: 'Pay remaining vendor balances', category: 'Other' },
  { days: MONTH, title: 'Buy or rent the tea ceremony set (teapot, cups, tray)', category: 'Tea Ceremony' },

  // ── 2 weeks ──
  { days: 14, title: 'Give the caterer the final headcount', category: 'Food' },
  { days: 14, title: 'Finalise the seating chart', category: 'Other' },
  { days: 14, title: 'Confirm arrival times with every vendor', category: 'Other' },
  { days: 14, title: 'Break in the wedding shoes', category: 'Attire' },
  { days: 14, title: 'Confirm the tea ceremony room and morning-of timeline', category: 'Tea Ceremony' },

  // ── 1 week ──
  { days: 7, title: 'Pack for the honeymoon', category: 'Travel' },
  { days: 7, title: 'Assemble tips and final payments in envelopes', category: 'Other' },
  { days: 7, title: 'Deliver the timeline to the wedding party', category: 'Other' },
  { days: 7, title: 'Confirm hair and makeup call times', category: 'Attire' },
  { days: 7, title: 'Prepare red packets (lai see) for the tea ceremony and banquet', category: 'Tea Ceremony' },

  // ── The last days ──
  { days: 2, title: 'Rehearsal and rehearsal dinner', category: 'Other' },
  { days: 1, title: 'Drop off decor and place cards at the venue', category: 'Flowers' },
  { days: 1, title: 'Steam the dress and press the suits', category: 'Attire' },
  { days: 1, title: 'Pack the tea ceremony set, gifts and red packets', category: 'Tea Ceremony' },
  { days: 1, title: 'Get an early night', category: 'Other' },
]

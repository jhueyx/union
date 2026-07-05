// Union — shared TypeScript types for the wedding platform

export type SitePhase =
  | 'coming-soon'
  | 'save-the-date'
  | 'invitation'
  | 'rsvp'
  | 'guest-info'
  | 'wedding-day'
  | 'archive'

export interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  householdId: string
}

export interface Household {
  id: string
  name: string // e.g. "The Johnson Family"
  inviteCode: string
  guestIds: string[]
  maxGuests: number
  notes?: string
}

export interface MealChoice {
  id: string
  label: string
  description?: string
  dietaryTags: string[] // e.g. ['vegetarian', 'gluten-free']
}

export interface RSVPResponse {
  householdId: string
  guestId: string
  attending: boolean
  mealChoiceId?: string
  dietaryRestrictions?: string
  songRequest?: string
  notes?: string
  submittedAt: string
}

export interface WeddingEvent {
  id: string
  name: string
  time: string
  endTime?: string
  location: string
  address?: string
  description?: string
  dresscode?: string
}

export interface RegistryLink {
  id: string
  store: string
  url: string
  note?: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
}

export interface TravelRecommendation {
  id: string
  type: 'hotel' | 'transport' | 'activity' | 'restaurant'
  name: string
  address?: string
  url?: string
  note?: string
  priceRange?: string
  bookingCode?: string
}

export interface SongRequest {
  householdId: string
  guestName: string
  song: string
  artist?: string
}

export interface AdminStats {
  totalInvited: number
  rsvpReceived: number
  attending: number
  notAttending: number
  pending: number
  mealCounts: Record<string, number>
  dietaryFlags: string[]
  songRequests: SongRequest[]
}

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
  household_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  created_at?: string
}

export interface Household {
  id: string
  name: string
  invite_code: string
  max_guests: number
  notes?: string
  created_at?: string
  guests?: Guest[]
}

export interface MealChoice {
  id: string
  label: string
  description?: string
  dietaryTags: string[]
}

export interface RSVPResponse {
  id?: string
  household_id: string
  guest_id: string
  attending: boolean
  meal_choice_id?: string
  dietary_restrictions?: string
  song_request?: string
  notes?: string
  submitted_at?: string
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

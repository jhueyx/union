// Union — mock data for the wedding platform.
// Swap these constants for Supabase queries when the backend is wired up.

import type {
  Household,
  Guest,
  MealChoice,
  FAQItem,
  TravelRecommendation,
  RegistryLink,
  WeddingEvent,
  RSVPResponse,
} from '../types'

// ── Households ──────────────────────────────────────────────
export const HOUSEHOLDS: Household[] = [
  { id: 'hh-1', name: 'The Johnson Family', inviteCode: 'AB7KQ2', guestIds: ['g-1', 'g-2', 'g-3'], maxGuests: 3 },
  { id: 'hh-2', name: 'Emily & Marcus Reyes', inviteCode: 'RM4XP9', guestIds: ['g-4', 'g-5'], maxGuests: 2 },
  { id: 'hh-3', name: 'Grandma Patricia', inviteCode: 'GP1LN8', guestIds: ['g-6'], maxGuests: 1, notes: 'Needs wheelchair-accessible seating.' },
  { id: 'hh-4', name: 'The Nguyen Household', inviteCode: 'NG9TR3', guestIds: ['g-7', 'g-8'], maxGuests: 2 },
  { id: 'hh-5', name: 'David Cohen & Guest', inviteCode: 'DC5WZ1', guestIds: ['g-9', 'g-10'], maxGuests: 2 },
  { id: 'hh-6', name: 'The Okafor Family', inviteCode: 'OK3BV7', guestIds: ['g-11', 'g-12', 'g-13'], maxGuests: 4 },
  { id: 'hh-7', name: 'Sophie Laurent', inviteCode: 'SL8QD4', guestIds: ['g-14'], maxGuests: 2 },
  { id: 'hh-8', name: 'The Martinez Family', inviteCode: 'MZ2HK6', guestIds: ['g-15', 'g-16', 'g-17'], maxGuests: 3 },
  { id: 'hh-9', name: 'Aunt Carol & Uncle Ray', inviteCode: 'CR6YF5', guestIds: ['g-18', 'g-19'], maxGuests: 2 },
  { id: 'hh-10', name: 'Priya & Arjun Patel', inviteCode: 'PP7NM0', guestIds: ['g-20', 'g-21'], maxGuests: 2 },
]

// ── Guests ──────────────────────────────────────────────────
export const GUESTS: Guest[] = [
  { id: 'g-1', firstName: 'Robert', lastName: 'Johnson', email: 'robert.johnson@example.com', householdId: 'hh-1' },
  { id: 'g-2', firstName: 'Linda', lastName: 'Johnson', email: 'linda.johnson@example.com', householdId: 'hh-1' },
  { id: 'g-3', firstName: 'Tyler', lastName: 'Johnson', householdId: 'hh-1' },
  { id: 'g-4', firstName: 'Emily', lastName: 'Reyes', email: 'emily.reyes@example.com', householdId: 'hh-2' },
  { id: 'g-5', firstName: 'Marcus', lastName: 'Reyes', email: 'marcus.reyes@example.com', householdId: 'hh-2' },
  { id: 'g-6', firstName: 'Patricia', lastName: 'Whitfield', phone: '555-0142', householdId: 'hh-3' },
  { id: 'g-7', firstName: 'Kim', lastName: 'Nguyen', email: 'kim.nguyen@example.com', householdId: 'hh-4' },
  { id: 'g-8', firstName: 'Daniel', lastName: 'Nguyen', householdId: 'hh-4' },
  { id: 'g-9', firstName: 'David', lastName: 'Cohen', email: 'david.cohen@example.com', householdId: 'hh-5' },
  { id: 'g-10', firstName: 'Rachel', lastName: 'Green', householdId: 'hh-5' },
  { id: 'g-11', firstName: 'Chidi', lastName: 'Okafor', email: 'chidi.okafor@example.com', householdId: 'hh-6' },
  { id: 'g-12', firstName: 'Ada', lastName: 'Okafor', email: 'ada.okafor@example.com', householdId: 'hh-6' },
  { id: 'g-13', firstName: 'Zara', lastName: 'Okafor', householdId: 'hh-6' },
  { id: 'g-14', firstName: 'Sophie', lastName: 'Laurent', email: 'sophie.laurent@example.com', householdId: 'hh-7' },
  { id: 'g-15', firstName: 'Carlos', lastName: 'Martinez', email: 'carlos.martinez@example.com', householdId: 'hh-8' },
  { id: 'g-16', firstName: 'Maria', lastName: 'Martinez', email: 'maria.martinez@example.com', householdId: 'hh-8' },
  { id: 'g-17', firstName: 'Lucia', lastName: 'Martinez', householdId: 'hh-8' },
  { id: 'g-18', firstName: 'Carol', lastName: 'Bennett', email: 'carol.bennett@example.com', householdId: 'hh-9' },
  { id: 'g-19', firstName: 'Ray', lastName: 'Bennett', householdId: 'hh-9' },
  { id: 'g-20', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@example.com', householdId: 'hh-10' },
  { id: 'g-21', firstName: 'Arjun', lastName: 'Patel', email: 'arjun.patel@example.com', householdId: 'hh-10' },
]

// ── Meal choices ────────────────────────────────────────────
export const MEAL_CHOICES: MealChoice[] = [
  { id: 'meal-chicken', label: 'Herb-Roasted Chicken', description: 'Free-range chicken with rosemary jus and seasonal vegetables.', dietaryTags: ['gluten-free'] },
  { id: 'meal-salmon', label: 'Pan-Seared Salmon', description: 'Wild salmon with lemon beurre blanc and asparagus.', dietaryTags: ['gluten-free', 'pescatarian'] },
  { id: 'meal-vegetarian', label: 'Wild Mushroom Risotto', description: 'Creamy arborio risotto with truffle oil and parmesan.', dietaryTags: ['vegetarian', 'gluten-free'] },
]

// ── FAQ ─────────────────────────────────────────────────────
export const FAQ_ITEMS: FAQItem[] = [
  { id: 'faq-1', category: 'Logistics', question: 'What time should I arrive?', answer: 'Please plan to arrive 30 minutes before the ceremony so you can be seated comfortably. Doors open one hour prior.' },
  { id: 'faq-2', category: 'Logistics', question: 'Is there parking at the venue?', answer: 'Yes, complimentary valet and self-parking are available on-site. We also recommend rideshare for guests staying nearby.' },
  { id: 'faq-3', category: 'Attire', question: 'What is the dress code?', answer: 'The celebration is black tie optional. Think elegant cocktail or formal attire. The ceremony and reception are both indoors.' },
  { id: 'faq-4', category: 'Guests', question: 'Can I bring a plus-one?', answer: 'Your invitation will indicate the number of seats reserved for your household. Please refer to your RSVP for details.' },
  { id: 'faq-5', category: 'Guests', question: 'Are children welcome?', answer: 'We love your little ones, but this will be an adults-only celebration with a few exceptions noted on individual invitations.' },
  { id: 'faq-6', category: 'Food', question: 'What about dietary restrictions?', answer: 'Absolutely. When you RSVP you can select a meal and note any allergies or restrictions. Our caterer will accommodate you.' },
  { id: 'faq-7', category: 'Logistics', question: 'Will the ceremony be indoors or outdoors?', answer: 'The ceremony will be held outdoors in the garden, weather permitting, with a covered indoor backup. The reception is fully indoors.' },
  { id: 'faq-8', category: 'Gifts', question: 'Where are you registered?', answer: 'Your presence is the greatest gift. For those who wish to give, our registry links are on the Registry page.' },
]

// ── Travel ──────────────────────────────────────────────────
export const TRAVEL_RECOMMENDATIONS: TravelRecommendation[] = [
  { id: 'tr-1', type: 'hotel', name: 'The Grand Magnolia Hotel', address: '120 Riverside Ave, Placeholder City', url: '#', note: 'Room block reserved under "Sally & Jason". A short walk to the venue.', priceRange: '$$$', bookingCode: 'SALLYJASON' },
  { id: 'tr-2', type: 'hotel', name: 'Cedar & Vine Boutique Inn', address: '45 Orchard Lane, Placeholder City', url: '#', note: 'Charming boutique option, 10 minutes from the venue.', priceRange: '$$' },
  { id: 'tr-3', type: 'hotel', name: 'Harborview Suites', address: '900 Bay Street, Placeholder City', url: '#', note: 'Budget-friendly with free shuttle service.', priceRange: '$' },
  { id: 'tr-4', type: 'transport', name: 'Placeholder Regional Airport (PLC)', note: 'Nearest airport, approximately 25 minutes from the venue. Rideshare and rental cars available.', url: '#' },
  { id: 'tr-5', type: 'transport', name: 'Shuttle Service', note: 'A complimentary shuttle will run between The Grand Magnolia Hotel and the venue on the wedding day.', priceRange: 'Free' },
]

// ── Registry ────────────────────────────────────────────────
export const REGISTRY_LINKS: RegistryLink[] = [
  { id: 'reg-1', store: 'Zola', url: '#', note: 'Our main registry — home, honeymoon fund, and more.' },
  { id: 'reg-2', store: 'Williams-Sonoma', url: '#', note: 'Kitchen and entertaining essentials.' },
  { id: 'reg-3', store: 'Crate & Barrel', url: '#', note: 'Furnishings and home décor.' },
  { id: 'reg-4', store: 'Honeymoon Fund', url: '#', note: 'Help us make memories on our first trip as newlyweds.' },
]

// ── Wedding events ──────────────────────────────────────────
export const WEDDING_EVENTS: WeddingEvent[] = [
  { id: 'evt-1', name: 'Ceremony', time: '4:00 PM', endTime: '4:45 PM', location: 'The Garden Terrace', address: '500 Vineyard Rd, Placeholder City', description: 'Join us as we exchange vows beneath the magnolias.', dresscode: 'Black Tie Optional' },
  { id: 'evt-2', name: 'Cocktail Hour', time: '5:00 PM', endTime: '6:00 PM', location: 'The Veranda', description: 'Signature cocktails, hors d’oeuvres, and live jazz.' },
  { id: 'evt-3', name: 'Reception', time: '6:00 PM', endTime: '11:00 PM', location: 'The Grand Ballroom', description: 'Dinner, dancing, and celebration into the night.' },
]

// ── Pre-filled RSVPs (for admin dashboard realism) ──────────
export const RSVP_RESPONSES: RSVPResponse[] = [
  { householdId: 'hh-1', guestId: 'g-1', attending: true, mealChoiceId: 'meal-chicken', submittedAt: '2026-06-01T14:22:00Z', songRequest: 'September — Earth, Wind & Fire' },
  { householdId: 'hh-1', guestId: 'g-2', attending: true, mealChoiceId: 'meal-salmon', dietaryRestrictions: 'No shellfish', submittedAt: '2026-06-01T14:22:00Z' },
  { householdId: 'hh-1', guestId: 'g-3', attending: false, submittedAt: '2026-06-01T14:22:00Z' },
  { householdId: 'hh-2', guestId: 'g-4', attending: true, mealChoiceId: 'meal-vegetarian', dietaryRestrictions: 'Vegan if possible', submittedAt: '2026-06-03T09:10:00Z', songRequest: 'Dancing Queen — ABBA', notes: 'So happy for you both!' },
  { householdId: 'hh-2', guestId: 'g-5', attending: true, mealChoiceId: 'meal-chicken', submittedAt: '2026-06-03T09:10:00Z' },
  { householdId: 'hh-3', guestId: 'g-6', attending: true, mealChoiceId: 'meal-salmon', dietaryRestrictions: 'Soft foods preferred', submittedAt: '2026-06-05T16:45:00Z', notes: 'Wouldn’t miss it for the world.' },
  { householdId: 'hh-5', guestId: 'g-9', attending: true, mealChoiceId: 'meal-chicken', submittedAt: '2026-06-08T11:30:00Z', songRequest: 'Sweet Caroline — Neil Diamond' },
  { householdId: 'hh-5', guestId: 'g-10', attending: false, submittedAt: '2026-06-08T11:30:00Z', notes: 'Traveling that week, sadly.' },
]

// Union — static content data. Households/guests/RSVPs live in Supabase.

import type { MealChoice, FAQItem, TravelRecommendation, RegistryLink, WeddingEvent } from '../types'

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
  { id: 'evt-2', name: 'Cocktail Hour', time: '5:00 PM', endTime: '6:00 PM', location: 'The Veranda', description: "Signature cocktails, hors d'oeuvres, and live jazz." },
  { id: 'evt-3', name: 'Reception', time: '6:00 PM', endTime: '11:00 PM', location: 'The Grand Ballroom', description: 'Dinner, dancing, and celebration into the night.' },
]

// Union — multi-step RSVP flow. State is structured for a future Supabase swap.
import { useState } from 'react'
import { HOUSEHOLDS, GUESTS, MEAL_CHOICES } from '../data/mock'
import { findHouseholdByCode, getHouseholdGuests } from '../utils'
import type { Household, Guest } from '../types'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

type Step = 'lookup' | 'confirm' | 'details' | 'done'

interface GuestState {
  guest: Guest
  attending: boolean | null
  mealChoiceId: string
  dietary: string
}

function lookup(query: string): Household | undefined {
  const q = query.trim()
  if (!q) return undefined
  // Try invite code first
  const byCode = findHouseholdByCode(q, HOUSEHOLDS)
  if (byCode) return byCode
  // Then a loose name match against household name or any guest name
  const lower = q.toLowerCase()
  return HOUSEHOLDS.find((h) => {
    if (h.name.toLowerCase().includes(lower)) return true
    const members = getHouseholdGuests(h, GUESTS)
    return members.some((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(lower)
    )
  })
}

export default function RsvpPage() {
  const [step, setStep] = useState<Step>('lookup')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [household, setHousehold] = useState<Household | null>(null)
  const [guestStates, setGuestStates] = useState<GuestState[]>([])
  const [songRequest, setSongRequest] = useState('')
  const [notes, setNotes] = useState('')

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    const match = lookup(query)
    if (!match) {
      setError('We couldn’t find an invitation matching that name or code. Please try again.')
      return
    }
    setError('')
    setHousehold(match)
    setGuestStates(
      getHouseholdGuests(match, GUESTS).map((guest) => ({
        guest,
        attending: null,
        mealChoiceId: '',
        dietary: '',
      }))
    )
    setStep('confirm')
  }

  const setAttending = (guestId: string, attending: boolean) => {
    setGuestStates((prev) =>
      prev.map((gs) => (gs.guest.id === guestId ? { ...gs, attending } : gs))
    )
  }

  const setMeal = (guestId: string, mealChoiceId: string) => {
    setGuestStates((prev) =>
      prev.map((gs) => (gs.guest.id === guestId ? { ...gs, mealChoiceId } : gs))
    )
  }

  const setDietary = (guestId: string, dietary: string) => {
    setGuestStates((prev) =>
      prev.map((gs) => (gs.guest.id === guestId ? { ...gs, dietary } : gs))
    )
  }

  const anyAttending = guestStates.some((gs) => gs.attending === true)
  const allAnswered = guestStates.every((gs) => gs.attending !== null)

  const handleConfirmNext = () => {
    if (!allAnswered) return
    // Skip details if nobody is attending — go straight to the closing screen.
    setStep(anyAttending ? 'details' : 'done')
  }

  const handleSubmit = () => {
    // TODO: replace with Supabase insert of RSVPResponse rows.
    setStep('done')
  }

  const reset = () => {
    setStep('lookup')
    setQuery('')
    setHousehold(null)
    setGuestStates([])
    setSongRequest('')
    setNotes('')
    setError('')
  }

  const attendingGuests = guestStates.filter((gs) => gs.attending === true)

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8 text-center">
        RSVP
      </p>

      {/* ── Step 1: Lookup ─────────────────────────────────── */}
      {step === 'lookup' && (
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-3 text-center">
            Find your invitation
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10 text-center leading-relaxed">
            Enter your name or the invite code from your invitation.
          </p>
          <form onSubmit={handleLookup} noValidate className="space-y-8">
            <Input
              label="Name or Invite Code"
              placeholder="e.g. Johnson  or  AB7KQ2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              error={error}
              autoFocus
            />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Search
            </Button>
          </form>
        </div>
      )}

      {/* ── Step 2: Confirm household ──────────────────────── */}
      {step === 'confirm' && household && (
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-2 text-center">
            Welcome, {household.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10 text-center">
            Your party of {guestStates.length} is invited. Please let us know who
            will be joining us.
          </p>

          <div className="space-y-6">
            {guestStates.map((gs) => (
              <div
                key={gs.guest.id}
                className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4"
              >
                <span className="text-sm text-zinc-900 dark:text-zinc-50">
                  {gs.guest.firstName} {gs.guest.lastName}
                </span>
                <div className="flex gap-2">
                  {[
                    { v: true, label: 'Attending' },
                    { v: false, label: 'Regrets' },
                  ].map(({ v, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAttending(gs.guest.id, v)}
                      className={[
                        'text-[10px] tracking-[0.15em] uppercase px-4 py-2 rounded-[2px] border transition-colors duration-150',
                        gs.attending === v
                          ? 'border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:border-zinc-400',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-10">
            <Button variant="ghost" size="sm" onClick={reset}>
              ← Start over
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmNext}
              disabled={!allAnswered}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Details ────────────────────────────────── */}
      {step === 'details' && (
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-10 text-center">
            A few details
          </h1>

          <div className="space-y-12">
            {attendingGuests.map((gs) => (
              <div key={gs.guest.id}>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-4">
                  {gs.guest.firstName} {gs.guest.lastName}
                </p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-3">
                  Meal Selection
                </p>
                <div className="space-y-2 mb-5">
                  {MEAL_CHOICES.map((meal) => (
                    <label
                      key={meal.id}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <span
                        className={[
                          'mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                          gs.mealChoiceId === meal.id
                            ? 'border-zinc-900 dark:border-zinc-50'
                            : 'border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-500',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {gs.mealChoiceId === meal.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-50" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name={`meal-${gs.guest.id}`}
                        checked={gs.mealChoiceId === meal.id}
                        onChange={() => setMeal(gs.guest.id, meal.id)}
                        className="sr-only"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {meal.label}
                        {meal.description && (
                          <span className="block text-xs text-zinc-400 dark:text-zinc-600">
                            {meal.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                <Input
                  label="Dietary Restrictions"
                  placeholder="Allergies, preferences, etc. (optional)"
                  value={gs.dietary}
                  onChange={(e) => setDietary(gs.guest.id, e.target.value)}
                />
              </div>
            ))}

            <Input
              label="Song Request"
              placeholder="Help us build the playlist (optional)"
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
            />

            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-2">
                Notes to the Couple
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything you’d like us to know (optional)"
                className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors duration-200 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-12">
            <Button variant="ghost" size="sm" onClick={() => setStep('confirm')}>
              ← Back
            </Button>
            <Button variant="primary" size="md" onClick={handleSubmit}>
              Submit RSVP
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirmation ───────────────────────────── */}
      {step === 'done' && household && (
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-4">
            Thank you, {household.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed">
            {anyAttending
              ? 'We can’t wait to celebrate with you.'
              : 'We’ll miss you, but thank you for letting us know.'}
          </p>

          <div className="text-left border-t border-zinc-100 dark:border-zinc-900 pt-8 space-y-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-4">
              Your Responses
            </p>
            {guestStates.map((gs) => {
              const meal = MEAL_CHOICES.find((m) => m.id === gs.mealChoiceId)
              return (
                <div
                  key={gs.guest.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-900 dark:text-zinc-50">
                    {gs.guest.firstName} {gs.guest.lastName}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {gs.attending
                      ? meal
                        ? `Attending · ${meal.label}`
                        : 'Attending'
                      : 'Regrets'}
                  </span>
                </div>
              )
            })}
            {songRequest && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 pt-2">
                Song request: {songRequest}
              </p>
            )}
          </div>

          <div className="mt-10">
            <Button variant="secondary" size="md" onClick={reset}>
              Update RSVP
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

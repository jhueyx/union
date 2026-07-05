// Union — personalized invite landing at /i/:inviteCode.
import { useParams, Link } from 'react-router-dom'
import { HOUSEHOLDS, GUESTS } from '../data/mock'
import { findHouseholdByCode, getHouseholdGuests } from '../utils'

export default function InviteCode() {
  const { inviteCode = '' } = useParams()
  const household = findHouseholdByCode(inviteCode, HOUSEHOLDS)

  if (!household) {
    return (
      <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
          Invitation
        </p>
        <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-4">
          We couldn’t find your invitation
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed max-w-sm mx-auto">
          The code <span className="font-medium text-zinc-700 dark:text-zinc-300">{inviteCode}</span> didn’t
          match any invitation. You can look yourself up by name instead.
        </p>
        <Link
          to="/rsvp"
          className="inline-flex items-center justify-center rounded-[2px] text-xs font-medium tracking-[0.18em] uppercase px-7 py-3 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          Go to RSVP
        </Link>
      </div>
    )
  }

  const guests = getHouseholdGuests(household, GUESTS)

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
        You’re Invited
      </p>
      <h1
        className="text-4xl md:text-6xl text-zinc-900 dark:text-zinc-50 mb-6"
        style={{ fontFamily: "'Great Vibes', cursive", lineHeight: 1.1 }}
      >
        Sally &amp; Jason
      </h1>
      <p className="text-lg font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-2">
        Welcome, {household.name}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
        {guests.map((g) => g.firstName).join(' & ')} — we would be honoured to
        have you celebrate with us.
      </p>
      <Link
        to="/rsvp"
        className="inline-flex items-center justify-center rounded-[2px] text-xs font-medium tracking-[0.18em] uppercase px-9 py-3.5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        Continue to RSVP
      </Link>
    </div>
  )
}

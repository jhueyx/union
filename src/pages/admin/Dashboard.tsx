// Union — admin dashboard. Aggregates mock RSVP data into live stats.
import { HOUSEHOLDS, GUESTS, RSVP_RESPONSES, MEAL_CHOICES } from '../../data/mock'
import { computeAdminStats } from '../../utils'

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
      <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">{label}</p>
      <p className={['text-3xl font-[300] tabular-nums', accent ?? 'text-zinc-50'].join(' ')}>
        {value}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const stats = computeAdminStats(HOUSEHOLDS, GUESTS, RSVP_RESPONSES)
  const responseRate =
    stats.totalInvited > 0
      ? Math.round((stats.rsvpReceived / stats.totalInvited) * 100)
      : 0

  const mealLabel = (id: string) =>
    MEAL_CHOICES.find((m) => m.id === id)?.label ?? id

  // Notes pulled directly from RSVP rows.
  const notes = RSVP_RESPONSES.filter((r) => r.notes?.trim()).map((r) => {
    const guest = GUESTS.find((g) => g.id === r.guestId)
    return {
      who: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
      note: r.notes as string,
    }
  })

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="text-xl font-[300] tracking-[0.1em] text-zinc-50">
          Union — Admin
        </h1>
        <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-600">
          Last updated {new Date().toLocaleString('en-US')}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        <StatCard label="Total Invited" value={stats.totalInvited} />
        <StatCard label="RSVP’d" value={stats.rsvpReceived} />
        <StatCard label="Attending" value={stats.attending} accent="text-emerald-400" />
        <StatCard label="Not Attending" value={stats.notAttending} accent="text-rose-400" />
        <StatCard label="Pending" value={stats.pending} accent="text-amber-400" />
      </div>

      {/* Response rate */}
      <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950 mb-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">Response Rate</p>
          <span className="text-sm tabular-nums text-zinc-300">{responseRate}%</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-50 rounded-full transition-all"
            style={{ width: `${responseRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meal counts */}
        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Meal Counts</p>
          {Object.keys(stats.mealCounts).length === 0 ? (
            <p className="text-sm text-zinc-600">No meals selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(stats.mealCounts).map(([id, count]) => (
                <li key={id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{mealLabel(id)}</span>
                  <span className="tabular-nums text-zinc-50">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dietary flags */}
        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Dietary Restrictions</p>
          {stats.dietaryFlags.length === 0 ? (
            <p className="text-sm text-zinc-600">None reported.</p>
          ) : (
            <ul className="space-y-2">
              {stats.dietaryFlags.map((flag, i) => (
                <li key={i} className="text-sm text-zinc-300">{flag}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Song requests */}
        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Song Requests</p>
          {stats.songRequests.length === 0 ? (
            <p className="text-sm text-zinc-600">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.songRequests.map((s, i) => (
                <li key={i} className="text-sm">
                  <span className="text-zinc-300">{s.song}</span>
                  <span className="text-zinc-600"> — {s.guestName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Guest notes */}
        <div className="border border-zinc-800 rounded-[2px] p-5 bg-zinc-950">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">Guest Notes</p>
          {notes.length === 0 ? (
            <p className="text-sm text-zinc-600">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n, i) => (
                <li key={i} className="text-sm">
                  <span className="text-zinc-300 italic">“{n.note}”</span>
                  <span className="block text-[10px] tracking-[0.15em] uppercase text-zinc-600 mt-1">
                    — {n.who}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

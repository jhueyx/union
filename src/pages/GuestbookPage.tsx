// Union — guestbook. Public SELECT + INSERT in wedding_guestbook; entries
// are visible to every visitor immediately, moderation (delete) is admin-only.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

interface Entry {
  id: string
  name: string
  message: string
  created_at: string
}

async function loadEntries(): Promise<Entry[]> {
  const { data } = await supabase
    .from('wedding_guestbook')
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as Entry[]
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { loadEntries().then(e => { setEntries(e); setLoading(false) }) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedMessage = message.trim()
    if (!trimmedName || !trimmedMessage) return
    setSubmitting(true)
    const { data, error: err } = await supabase
      .from('wedding_guestbook')
      .insert({ name: trimmedName, message: trimmedMessage })
      .select('id, name, message, created_at')
      .single()
    setSubmitting(false)
    if (err) { setError("Something went wrong signing the guestbook. Please try again."); return }
    setEntries(prev => [data as Entry, ...prev])
    setName('')
    setMessage('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-8 text-center">
        Guestbook
      </p>
      <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 mb-10 text-center">
        Leave us a note
      </h1>

      <form onSubmit={handleSubmit} noValidate className="max-w-md mx-auto space-y-6 mb-16">
        <Input
          label="Your Name"
          placeholder="Who’s writing?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-600 mb-2">
            Your Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Share a wish or a memory"
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 placeholder-zinc-600 border-b border-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
          />
        </div>
        <Button type="submit" variant="primary" size="md" className="w-full" disabled={submitting}>
          {submitting ? 'Signing…' : 'Sign the Guestbook'}
        </Button>
        {submitted && (
          <p className="text-xs text-zinc-600 text-center tracking-wide">
            Thank you for your note.
          </p>
        )}
        {error && <p className="text-xs text-red-500 text-center tracking-wide">{error}</p>}
      </form>

      <div className="max-w-md mx-auto space-y-8">
        {loading ? (
          <p className="text-xs text-zinc-500 text-center">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center">Be the first to sign.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border-b border-zinc-100 pb-6 last:border-0">
              <p className="text-sm text-zinc-700 leading-relaxed italic">
                “{entry.message}”
              </p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 mt-3">
                — {entry.name}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

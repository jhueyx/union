// Union — guestbook. Front-end only for now; entries are held in local state.
import { useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

interface Entry {
  name: string
  message: string
}

const SEED_ENTRIES: Entry[] = [
  { name: 'Emily & Marcus', message: 'So thrilled for you two. Here’s to a lifetime of love!' },
  { name: 'Grandma Patricia', message: 'My heart is full. I couldn’t be prouder of you both.' },
  { name: 'The Okafor Family', message: 'Wishing you endless joy and adventure together.' },
]

export default function GuestbookPage() {
  const [entries, setEntries] = useState<Entry[]>(SEED_ENTRIES)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setEntries((prev) => [{ name: name.trim(), message: message.trim() }, ...prev])
    setName('')
    setMessage('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8 text-center">
        Guestbook
      </p>
      <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-10 text-center">
        Leave us a note
      </h1>

      <form onSubmit={handleSubmit} noValidate className="max-w-md mx-auto space-y-6 mb-16">
        <Input
          label="Your Name"
          placeholder="Who’s writing?"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-2">
            Your Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Share a wish or a memory"
            className="w-full bg-transparent px-0 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
          />
        </div>
        <Button type="submit" variant="primary" size="md" className="w-full">
          Sign the Guestbook
        </Button>
        {submitted && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center tracking-wide">
            Thank you for your note.
          </p>
        )}
      </form>

      <div className="max-w-md mx-auto space-y-8">
        {entries.map((entry, i) => (
          <div key={i} className="border-b border-zinc-100 dark:border-zinc-900 pb-6 last:border-0">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
              “{entry.message}”
            </p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mt-3">
              — {entry.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

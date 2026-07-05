// Union — live countdown timer to the wedding date.
import { useState, useEffect } from 'react'
import { getCountdown } from '../utils'

interface Props {
  targetDate: string
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl md:text-5xl font-[300] tabular-nums text-zinc-900 dark:text-zinc-50">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-2 text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600">
        {label}
      </span>
    </div>
  )
}

export default function CountdownTimer({ targetDate }: Props) {
  const [remaining, setRemaining] = useState(() => getCountdown(targetDate))

  useEffect(() => {
    setRemaining(getCountdown(targetDate))
    const id = setInterval(() => {
      setRemaining(getCountdown(targetDate))
    }, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!remaining) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-600 tracking-wide">
        The countdown will begin once our date is set.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4 md:gap-10">
      <Unit value={remaining.days} label="Days" />
      <Unit value={remaining.hours} label="Hours" />
      <Unit value={remaining.minutes} label="Minutes" />
      <Unit value={remaining.seconds} label="Seconds" />
    </div>
  )
}

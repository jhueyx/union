import type { ReactNode } from 'react'

interface Props {
  id: string
  label: string
  children: ReactNode
}

export default function Section({ id, label, children }: Props) {
  return (
    <section
      id={id}
      className="border-t border-zinc-100 dark:border-zinc-900 py-20 md:py-28 px-6"
    >
      <div className="max-w-[700px] mx-auto">
        <p className="text-center text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-14">
          {label}
        </p>
        {children}
      </div>
    </section>
  )
}

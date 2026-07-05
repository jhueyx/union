// Union — FAQ page with a simple accordion grouped by category.
import { useState } from 'react'
import { FAQ_ITEMS } from '../data/mock'
import type { FAQItem } from '../types'

function groupByCategory(items: FAQItem[]): Record<string, FAQItem[]> {
  return items.reduce<Record<string, FAQItem[]>>((acc, item) => {
    const key = item.category ?? 'General'
    ;(acc[key] ??= []).push(item)
    return acc
  }, {})
}

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const groups = groupByCategory(FAQ_ITEMS)

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-12 text-center">
        Frequently Asked
      </p>

      <div className="max-w-lg mx-auto space-y-12">
        {FAQ_ITEMS.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center">
            Details coming soon.
          </p>
        )}
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-4">
              {category}
            </p>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900 border-t border-b border-zinc-100 dark:border-zinc-900">
              {items.map((item) => {
                const isOpen = openId === item.id
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 py-5 text-left"
                    >
                      <span className="text-sm text-zinc-900 dark:text-zinc-50">
                        {item.question}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-600 shrink-0">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pb-5 pr-8">
                        {item.answer}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

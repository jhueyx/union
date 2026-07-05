// Union — registry page.
import { REGISTRY_LINKS } from '../data/mock'

export default function RegistryPage() {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8 text-center">
        Registry
      </p>

      <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-12 leading-relaxed text-center">
        Your presence is the greatest gift. For those who wish to give, we are
        registered at the following.
      </p>

      <div className="max-w-md mx-auto space-y-4">
        {REGISTRY_LINKS.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-zinc-200 dark:border-zinc-800 rounded-[2px] p-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-[300] tracking-[0.06em] text-zinc-900 dark:text-zinc-50">
                {r.store}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition-colors">
                ↗
              </span>
            </div>
            {r.note && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2 leading-relaxed">
                {r.note}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}

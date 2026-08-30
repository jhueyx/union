import Section from '../Section'
import { WEDDING } from '../../config'

export default function Registry() {
  const { registry } = WEDDING

  return (
    <Section id="registry" label="Registry">
      <p className="text-center text-sm text-zinc-500 max-w-sm mx-auto mb-12 leading-relaxed">
        Your presence is the greatest gift. For those who wish to give, we're
        registered at the following.
      </p>

      {registry.length === 0 ? (
        <p className="text-center text-sm text-zinc-600">
          Registry details coming soon.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {registry.map(({ store, url }) => (
            <a
              key={store}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'px-7 py-3 rounded-[2px]',
                'border border-zinc-200',
                'text-xs tracking-[0.15em] uppercase',
                'text-zinc-500',
                'hover:border-zinc-400',
                'hover:text-zinc-900',
                'transition-all duration-200',
              ].join(' ')}
            >
              {store} ↗
            </a>
          ))}
        </div>
      )}
    </Section>
  )
}

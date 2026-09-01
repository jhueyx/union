import { useSiteContent } from '../lib/siteContent'

export default function Footer() {
  const { isLive } = useSiteContent()
  const year = new Date().getFullYear()

  // Hidden in coming-soon mode, same as Nav — no footer chrome on the bare landing page.
  if (!isLive) return null

  return (
    <footer className="w-full py-8 px-6">
      {/* Hairline rule */}
      <div className="w-full h-px bg-zinc-100 mb-8"aria-hidden="true"/>

      <p
        className={[
          'text-center',
          'text-xs tracking-[0.2em]',
          'text-zinc-600',
        ].join(' ')}
      >
        © {year} Sally &amp; Jason
      </p>
    </footer>
  )
}

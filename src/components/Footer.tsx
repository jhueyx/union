export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full py-8 px-6">
      {/* Hairline rule */}
      <div className="w-full h-px bg-zinc-100 dark:bg-zinc-900 mb-8" aria-hidden="true" />

      <p
        className={[
          'text-center',
          'text-xs tracking-[0.2em]',
          'text-zinc-300 dark:text-zinc-700',
        ].join(' ')}
      >
        © {year} Sally &amp; Jason
      </p>
    </footer>
  )
}

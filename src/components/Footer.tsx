export default function Footer() {
  const year = new Date().getFullYear()

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

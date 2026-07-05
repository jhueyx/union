// Union — photos placeholder page.
export default function PhotosPage() {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
        Photos
      </p>
      <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-4">
        Photos coming soon
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-12 leading-relaxed">
        We’ll share memories from our wedding day here. Check back after the
        celebration.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-md mx-auto" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[2px] border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950"
          />
        ))}
      </div>
    </div>
  )
}

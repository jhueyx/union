// Union — our story page.
export default function StoryPage() {
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8 text-center">
        Our Story
      </p>

      <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 dark:text-zinc-50 mb-16 text-center">
        Sally &amp; Jason
      </h1>

      {/* Photo placeholder */}
      <div className="w-full aspect-[3/2] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2px] mb-16 flex items-center justify-center">
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600">
          Photo
        </p>
      </div>

      {/* Story sections */}
      <div className="space-y-12 text-sm md:text-base leading-[1.9] text-zinc-600 dark:text-zinc-400 max-w-[560px] mx-auto">

        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-4">
            How We Met
          </p>
          <p>
            [Write how you two first met — where, when, and what made it memorable.]
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-4">
            The Relationship
          </p>
          <p>
            [Share what your relationship has been like — the adventures, the everyday moments, what makes your partnership unique.]
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-4">
            The Proposal
          </p>
          <p>
            [Tell the proposal story — the setting, the moment, and what was said.]
          </p>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-900 pt-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 italic">
            We can't wait to celebrate with you.
          </p>
        </div>

      </div>
    </div>
  )
}

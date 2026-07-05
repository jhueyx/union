// Union — home page. Renders the existing Hero, plus a welcome note in live mode.
import { SITE_MODE } from '../config'
import Hero from '../components/Hero'

const isLive = SITE_MODE === 'live'

export default function Home() {
  return (
    <>
      <div className="flex items-center justify-center min-h-[90vh] px-6 py-20">
        <Hero />
      </div>

      {isLive && (
        <section className="border-t border-zinc-100 dark:border-zinc-900">
          <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28 text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-600 mb-8">
              Welcome
            </p>
            <p className="text-sm md:text-base leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-[520px] mx-auto">
              We are so glad you are here. Explore the pages above to find our
              schedule, travel details, and everything you need to celebrate
              with us. When you are ready, we would love for you to RSVP.
            </p>
          </div>
        </section>
      )}
    </>
  )
}

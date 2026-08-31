// Union — gifts page.
import { useSiteContent } from '../lib/siteContent'

export default function RegistryPage() {
  const { giftMessage } = useSiteContent()
  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-8 text-center">
        Gifts
      </p>

      <p className="text-sm md:text-base text-zinc-500 max-w-sm mx-auto leading-relaxed text-center whitespace-pre-line">
        {giftMessage}
      </p>
    </div>
  )
}

// Union — our story page.
import { useSiteContent } from '../lib/siteContent'

export default function StoryPage() {
  const { story, wedding } = useSiteContent()
  const photo = wedding.storyPhotoUrl

  return (
    <div className="max-w-[700px] mx-auto px-6 py-20 md:py-28">
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-8 text-center">
        Our Story
      </p>

      <h1 className="text-2xl font-[300] tracking-[0.08em] text-zinc-900 mb-16 text-center">
        {wedding.coupleNames}
      </h1>

      {/* Photo */}
      {photo ? (
        <img
          src={photo}
          alt=""
          className="w-full aspect-[3/2] object-cover rounded-[2px] mb-16"
        />
      ) : (
        <div className="w-full aspect-[3/2] bg-zinc-100 border border-zinc-200 rounded-[2px] mb-16 flex items-center justify-center">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-600">
            Photo
          </p>
        </div>
      )}

      {/* Story sections */}
      <div className="space-y-12 text-sm md:text-base leading-[1.9] text-zinc-600 max-w-[560px] mx-auto">

        {story.map((section) => (
          <div key={section.id}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-4">
              {section.heading}
            </p>
            <p className="whitespace-pre-line">{section.body}</p>
          </div>
        ))}

        <div className="border-t border-zinc-100 pt-12 text-center">
          <p className="text-zinc-500 italic">
            We can't wait to celebrate with you.
          </p>
        </div>

      </div>
    </div>
  )
}

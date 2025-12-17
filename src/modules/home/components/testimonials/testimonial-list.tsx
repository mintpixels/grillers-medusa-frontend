import Image from "next/image"
import { clx } from "@medusajs/ui"
import type { StrapiTestimonial } from "types/strapi"

type TestimonialListProps = {
  testimonials: StrapiTestimonial[]
  title?: string
  showRatings?: boolean
}

// Star rating component (compact)
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={clx("w-3 h-3", {
            "text-Gold": star <= rating,
            "text-Pewter/30": star > rating,
          })}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// Default avatar
const DefaultAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-8 h-8 rounded-full bg-Gold/20 flex items-center justify-center shrink-0">
      <span className="text-Charcoal font-maison-neue font-bold text-xs">
        {initials}
      </span>
    </div>
  )
}

export default function TestimonialList({
  testimonials,
  title,
  showRatings = true,
}: TestimonialListProps) {
  if (!testimonials || testimonials.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-Pewter/10">
      {title && (
        <h3 className="text-h6 font-rexton uppercase text-Charcoal mb-4 pb-3 border-b border-Pewter/10">
          {title}
        </h3>
      )}

      <ul className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <li
            key={testimonial.documentId}
            className={clx({
              "pb-4 border-b border-Pewter/10": index < testimonials.length - 1,
            })}
          >
            <div className="flex gap-3">
              {/* Photo or Avatar */}
              {testimonial.CustomerPhoto?.url ? (
                <Image
                  src={testimonial.CustomerPhoto.url}
                  alt={testimonial.CustomerName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <DefaultAvatar name={testimonial.CustomerName} />
              )}

              <div className="flex-1 min-w-0">
                {/* Name and rating */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-p-sm font-maison-neue font-bold text-Charcoal truncate">
                    {testimonial.CustomerName}
                  </span>
                  {showRatings && testimonial.Rating > 0 && (
                    <StarRating rating={testimonial.Rating} />
                  )}
                </div>

                {/* Quote (truncated) */}
                <p className="text-p-ex-sm text-Charcoal/70 font-maison-neue line-clamp-2">
                  &ldquo;{testimonial.TestimonialText}&rdquo;
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}


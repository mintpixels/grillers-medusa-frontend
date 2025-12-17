import Image from "next/image"
import { clx } from "@medusajs/ui"
import type { StrapiTestimonial } from "types/strapi"

type TestimonialCardProps = {
  testimonial: StrapiTestimonial
  showRating?: boolean
  variant?: "default" | "compact"
}

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={clx("w-4 h-4", {
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

// Default avatar when no photo is provided
const DefaultAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-12 h-12 rounded-full bg-Gold/20 flex items-center justify-center">
      <span className="text-Charcoal font-maison-neue font-bold text-lg">
        {initials}
      </span>
    </div>
  )
}

export default function TestimonialCard({
  testimonial,
  showRating = true,
  variant = "default",
}: TestimonialCardProps) {
  const {
    CustomerName,
    CustomerTitle,
    CustomerCompany,
    CustomerLocation,
    CustomerPhoto,
    TestimonialText,
    Rating,
  } = testimonial

  // Truncate long testimonials
  const shouldTruncate = variant === "compact" && TestimonialText.length > 150
  const displayText = shouldTruncate
    ? TestimonialText.slice(0, 150) + "..."
    : TestimonialText

  return (
    <article
      className={clx(
        "bg-white rounded-lg p-6 shadow-sm border border-Pewter/10 h-full flex flex-col",
        {
          "p-4": variant === "compact",
        }
      )}
    >
      {/* Rating */}
      {showRating && Rating > 0 && (
        <div className="mb-4">
          <StarRating rating={Rating} />
        </div>
      )}

      {/* Quote */}
      <blockquote
        className={clx("flex-1 mb-4", {
          "text-p-md": variant === "default",
          "text-p-sm": variant === "compact",
        })}
      >
        <p className="font-maison-neue text-Charcoal/80 italic leading-relaxed">
          &ldquo;{displayText}&rdquo;
        </p>
      </blockquote>

      {/* Author */}
      <footer className="flex items-center gap-3 mt-auto pt-4 border-t border-Pewter/10">
        {/* Photo or Avatar */}
        {CustomerPhoto?.url ? (
          <Image
            src={CustomerPhoto.url}
            alt={CustomerName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar name={CustomerName} />
        )}

        {/* Name and details */}
        <div>
          <cite className="not-italic font-maison-neue font-bold text-Charcoal text-p-sm">
            {CustomerName}
          </cite>
          {(CustomerTitle || CustomerCompany || CustomerLocation) && (
            <p className="text-p-ex-sm text-Charcoal/60 font-maison-neue">
              {CustomerTitle}
              {CustomerTitle && CustomerCompany && " at "}
              {CustomerCompany}
              {(CustomerTitle || CustomerCompany) && CustomerLocation && ", "}
              {CustomerLocation}
            </p>
          )}
        </div>
      </footer>
    </article>
  )
}


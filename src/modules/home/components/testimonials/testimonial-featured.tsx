import Image from "next/image"
import type { StrapiTestimonial } from "types/strapi"

type TestimonialFeaturedProps = {
  testimonial: StrapiTestimonial
  showRating?: boolean
  backgroundImage?: string
}

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1 justify-center" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-6 h-6 ${star <= rating ? "text-Charcoal" : "text-Pewter/30"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialFeatured({
  testimonial,
  showRating = true,
  backgroundImage,
}: TestimonialFeaturedProps) {
  const {
    CustomerName,
    CustomerTitle,
    CustomerCompany,
    CustomerLocation,
    CustomerPhoto,
    TestimonialText,
    Rating,
  } = testimonial

  return (
    <section className="py-16 md:py-24 bg-Scroll relative overflow-hidden">
      {/* Background Image (optional) */}
      {backgroundImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-contain"
          />
        </div>
      )}

      <div className="content-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Rating */}
          {showRating && Rating > 0 && (
            <div className="mb-8">
              <StarRating rating={Rating} />
            </div>
          )}

          {/* Quote */}
          <blockquote className="mb-10">
            <p className="text-quote-mobile md:text-quote font-gyst text-Charcoal leading-tight">
              &ldquo;{TestimonialText}&rdquo;
            </p>
          </blockquote>

          {/* Author */}
          <footer className="flex flex-col items-center gap-4">
            {/* Photo */}
            {CustomerPhoto?.url && (
              <Image
                src={CustomerPhoto.url}
                alt={CustomerName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover border-2 border-Gold"
              />
            )}

            <div>
              <cite className="not-italic font-rexton text-h5 uppercase text-Charcoal block">
                {CustomerName}
              </cite>
              {(CustomerTitle || CustomerCompany || CustomerLocation) && (
                <p className="text-p-md text-Charcoal/60 font-maison-neue mt-1">
                  {CustomerTitle}
                  {CustomerTitle && CustomerCompany && " at "}
                  {CustomerCompany}
                  {(CustomerTitle || CustomerCompany) && CustomerLocation && ", "}
                  {CustomerLocation}
                </p>
              )}
            </div>
          </footer>
        </div>
      </div>
    </section>
  )
}


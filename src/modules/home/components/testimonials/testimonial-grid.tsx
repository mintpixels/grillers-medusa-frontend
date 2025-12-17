import TestimonialCard from "./testimonial-card"
import type { StrapiTestimonial } from "types/strapi"

type TestimonialGridProps = {
  testimonials: StrapiTestimonial[]
  title?: string
  subtitle?: string
  showRatings?: boolean
  columns?: 1 | 2 | 3
}

export default function TestimonialGrid({
  testimonials,
  title,
  subtitle,
  showRatings = true,
  columns = 3,
}: TestimonialGridProps) {
  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }

  return (
    <section className="py-12 md:py-20 bg-Scroll">
      <div className="content-container">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2 className="text-h3 md:text-h2 font-gyst text-Charcoal mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-p-md font-maison-neue text-Charcoal/70 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Grid */}
        <div className={`grid ${gridCols[columns]} gap-6`}>
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.documentId}
              testimonial={testimonial}
              showRating={showRatings}
            />
          ))}
        </div>
      </div>
    </section>
  )
}


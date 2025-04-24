import React from "react"
import Image from "next/image"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"

export default function TestimonialSection({
  data,
}: {
  data: {
    TestimonialTitle: string
    BackgroundImage: {
      url: string
    }
    Quote: any
    Author: string
  }
}) {
  return (
    <section className="bg-Scroll overflow-hidden">
      <div className="pt-24 pb-16 md:pt-20 md:pb-28 md:mb-20 mt-4 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {data?.BackgroundImage?.url && (
            <Image
              src={data.BackgroundImage.url}
              alt="bg"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 80vw, 50vw"
            />
          )}
        </div>

        <div className="relative max-w-7xl mx-auto text-center px-4">
          <div className="flex justify-center mb-6 space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6 text-Charcoal"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 
                   1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 
                   2.44a1 1 0 00-.364 1.118l1.286 3.949c.3.922-.755 
                   1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 
                   0l-3.36 2.44c-.784.57-1.839-.196-1.54-1.118l1.286-3.95a1 
                   1 0 00-.364-1.118L2.025 9.377c-.783-.57-.38-1.81.588-1.81h4.15a1 
                   1 0 00.95-.69l1.286-3.95z"
                />
              </svg>
            ))}
          </div>

          {data?.Quote && (
            <blockquote className="text-quote-mobile md:text-quote font-gyst text-Charcoal mb-6">
              <BlocksRenderer content={data.Quote} />
            </blockquote>
          )}

          {data?.Author && (
            <cite className="block text-h5 font-rexton not-italic uppercase text-Charcoal">
              {data.Author}
            </cite>
          )}
        </div>
      </div>
    </section>
  )
}

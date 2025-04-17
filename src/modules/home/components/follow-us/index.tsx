"use client"

import React from "react"
import Image from "next/image"

const smallImages = [
  { id: 1, src: "https://placehold.co/232x232/png", alt: "Field" },
  { id: 2, src: "https://placehold.co/232x232/png", alt: "Grilled chicken" },
]

const bigImage = {
  src: "https://placehold.co/500x500/png",
  alt: "Raw steak on cutting board",
}

export default function FollowUsSection() {
  return (
    <section className="py-10 md:py-20 bg-Scroll">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="grid grid-cols-1 md:grid-cols-[0.5fr_1fr_1fr] gap-6">
          <div className="grid grid-rows-2 gap-4 h-full">
            {smallImages.map((img) => (
              <div
                key={img.id}
                className="relative w-full aspect-square overflow-hidden"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="relative w-full h-full aspect-square overflow-hidden">
            <Image
              src={bigImage.src}
              alt={bigImage.alt}
              fill
              className="object-cover"
            />
          </div>

          <div className="bg-white p-8 flex flex-col justify-center h-full px-10 md:px-24">
            <h3 className="text-h3 text-Charcoal mb-10">
              Follow us at <span className="font-semibold">@grillerspride</span>
            </h3>
            <p className="text-p-md text-Charcoal">
              See what we are up to and get inspiration for your next home
              cooked meal.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

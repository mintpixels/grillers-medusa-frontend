"use client"

import React from "react"
import Image from "next/image"

const features = [
  {
    title: "You Keep The Trade Discount.",
    desc: "Phasellus purus augue, rutrum et hendrerit ac, lacinia ac arcu. Ut in ante quis purus fringilla ultrices.",
  },
  {
    title: "Proven Process.",
    desc: "Phasellus purus augue, rutrum et hendrerit ac, lacinia ac arcu. Ut in ante quis purus fringilla ultrices.",
  },
  {
    title: "Transparent Pricing.",
    desc: "Phasellus purus augue, rutrum et hendrerit ac, lacinia ac arcu. Ut in ante quis purus fringilla ultrices.",
  },
]

export default function WhyUsSection() {
  return (
    <section className="py-10 md:py-20 bg-Scroll">
      <div className="mx-auto max-w-7xl px-4.5 grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-8">
        <div className="flex flex-col justify-between py-4 max-w-[365px]">
          <h3 className="text-h2 text-Charcoal mb-6">Why Us?</h3>
          <dl className="space-y-8 divide-y divide-Charcoal ">
            {features.map((f, i) => (
              <div key={i} className="pt-5 pb-3 border-t border-Charcoal">
                <dt className="text-h4 font-bold text-Charcoal pb-2 mb-2">
                  {f.title}
                </dt>
                <dd className="text-p-md text-Charcoal">{f.desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src="https://placehold.co/920x920/png"
            alt="Free-range chickens in a field"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}

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

export default function WhyUsSection({
  data,
}: {
  data: {
    Title: string
    Image: {
      url: string
    }
    List: {
      id: string
      Title: string
      Description: string
    }[]
  }
}) {
  return (
    <section className="py-10 md:py-20 bg-Scroll">
      <div className="mx-auto max-w-7xl px-4.5 grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-8">
        <div className="flex flex-col justify-between py-4 max-w-[365px]">
          <h3 className="text-h2 font-gyst text-Charcoal mb-6">
            {data?.Title}
          </h3>
          <dl className="space-y-8 divide-y divide-Charcoal">
            {data?.List?.slice(0, 3)?.map((item) => (
              <div key={item.id} className="pt-5 pb-3 border-t border-Charcoal">
                <dt className="text-h4 font-gyst font-bold text-Charcoal pb-2 mb-2">
                  {item?.Title}
                </dt>
                <dd className="text-p-md font-maison-neue text-Charcoal">
                  {item?.Description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src={data?.Image?.url}
            alt={data?.Title}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}

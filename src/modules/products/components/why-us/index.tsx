"use client"

import React from "react"
import Image from "next/image"

export default function WhyUsSection({
  data,
}: {
  data?: {
    Title: string
    Image?: {
      url: string
    } | null
    List: {
      id: string
      Title: string
      Description: string
    }[]
  } | null
}) {
  // Strapi common-PDP `WhyUs` block is optional. Bail entirely when it
  // isn't provided rather than render an empty heading or pass an
  // undefined image src (which throws). #128 cleanup.
  if (!data || !data.List?.length) return null

  const qmdTrustItems = [
    {
      id: "akc-supervision",
      Title: "AKC Supervised",
      Description:
        "Every product is processed under continuous Atlanta Kashruth Commission supervision, with a Mashgiach on-site every shift.",
    },
    {
      id: "own-plant",
      Title: "Our Own Plant",
      Description:
        "Single-ingredient cuts, prepared foods, smoked items, and sausages are handled by our team on our premises.",
    },
    {
      id: "family-run",
      Title: "Family-Run Service",
      Description:
        "Built on community trust and word-of-mouth, with real people available when you have a product, order, or kashruth question.",
    },
    {
      id: "regional-routes",
      Title: "Southeast Routes",
      Description:
        "Metro Atlanta home delivery, scheduled Southeast city deliveries, plant pickup, and nationwide UPS cold-chain shipping.",
    },
  ]
  const cmsItems = data.List.filter((item) => item?.Title && item?.Description)
  const trustItems = cmsItems.length >= 4 ? cmsItems.slice(0, 4) : qmdTrustItems

  return (
    <section className="bg-Scroll py-14 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-[0.72fr_1.28fr] md:items-start md:gap-16">
        <div>
          <p className="mb-3 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-RichGold">
            Why customers come back
          </p>
          <h3 className="mb-8 font-gyst text-h2-mobile text-Charcoal md:text-h2">
            {data.Title}
          </h3>

          {data.Image?.url && (
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-Charcoal/15 md:mt-10">
              <Image
                src={data.Image.url}
                alt={data.Title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 380px, 92vw"
              />
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 border-t border-Charcoal sm:grid-cols-2">
          {trustItems.map((item) => (
            <div
              key={item.id}
              className="border-b border-Charcoal py-5 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6 md:py-7"
            >
              <dt className="mb-3 font-gyst text-h4 font-bold text-Charcoal">
                {item.Title}
              </dt>
              <dd className="font-maison-neue text-p-md text-Charcoal">
                {item.Description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

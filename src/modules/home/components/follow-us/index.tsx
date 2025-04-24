"use client"

import React from "react"
import Image from "next/image"

export default function FollowUsSection({
  data,
}: {
  data: {
    SmallImages: { url: string }[]
    BigImage: { url: string }
    FollowUsTitle: string
    Description: string
  }
}) {
  return (
    <section className="py-10 md:py-20 bg-Scroll">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="grid grid-cols-1 md:grid-cols-[0.5fr_1fr_1fr] gap-6">
          <div className="grid grid-rows-2 gap-4 h-full">
            {data?.SmallImages?.map((img, index) => (
              <div
                key={index}
                className="relative w-full aspect-square overflow-hidden"
              >
                <Image
                  src={img.url}
                  alt={"small image"}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {data?.BigImage?.url && (
            <div className="relative w-full h-full aspect-square overflow-hidden">
              <Image
                src={data.BigImage.url}
                alt={"big image"}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="bg-white p-8 flex flex-col justify-center h-full px-10 md:px-24">
            {data?.FollowUsTitle && (
              <h3 className="text-h3 font-gyst text-Charcoal mb-10">
                {data.FollowUsTitle}
              </h3>
            )}
            {data?.Description && (
              <p className="text-p-md font-maison-neue text-Charcoal">
                {data.Description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

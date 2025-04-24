"use client"

import React from "react"
import Image from "next/image"

export default function HowItWorksSection({
  data,
}: {
  data: {
    Title: string
    Description: string
    Cards: {
      id: string
      Text: string
      Image: {
        url: string
      }
    }[]
  }
}) {
  return (
    <section className="py-16 bg-Charcoal">
      <div className="mx-auto max-w-6xl px-4.5 grid grid-cols-1 md:grid-cols-[0.8fr_1fr_1fr] gap-8">
        <div className="flex flex-col justify-center">
          {data?.Title && (
            <h3 className="text-h3 font-gyst text-Scroll mb-6 md:mb-14 max-w-[171px]">
              {data.Title}
            </h3>
          )}
          {data?.Description && (
            <p className="text-p-md font-maison-neue text-Scroll max-w-[210px]">
              {data.Description}
            </p>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">
          {data?.Cards?.slice(0, 2)?.map((card) => (
            <article key={card.id}>
              <Image
                src={card?.Image?.url}
                alt={card?.Text}
                className="object-cover w-full"
                height={392}
                width={365}
              />
              <h4 className="text-h6 font-rexton text-Scroll font-bold uppercase mt-4 max-w-[210px] pl-3">
                {card?.Text}
              </h4>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

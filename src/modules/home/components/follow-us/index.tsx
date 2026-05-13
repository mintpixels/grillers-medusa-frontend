"use client"

import React from "react"
import Image from "next/image"

const INSTAGRAM_URL = "https://www.instagram.com/grillerspride/"

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
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Griller's Pride on Instagram (@grillerspride)"
          className="group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-4 rounded-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-[0.5fr_1fr_1fr] gap-6">
            <div className="grid grid-rows-2 gap-4 h-full">
              {data?.SmallImages?.map((img, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-square overflow-hidden"
                >
                  <Image
                    src={img.url}
                    alt={`${data.FollowUsTitle || "Griller's Pride on Instagram"} photo ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </div>
              ))}
            </div>

            {data?.BigImage?.url && (
              <div className="relative w-full h-full aspect-square overflow-hidden">
                <Image
                  src={data.BigImage.url}
                  alt={data.FollowUsTitle || "Griller's Pride on Instagram"}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
              </div>
            )}

            <div className="bg-white p-8 flex flex-col justify-center h-full px-10 md:px-24 transition-colors duration-300 group-hover:bg-Scroll">
              {data?.FollowUsTitle && (
                <h2 className="text-h3 font-gyst text-Charcoal mb-10">
                  {data.FollowUsTitle}
                </h2>
              )}
              {data?.Description && (
                <p className="text-p-md font-maison-neue text-Charcoal">
                  {data.Description}
                </p>
              )}
              <span
                aria-hidden="true"
                className="mt-6 inline-flex items-center gap-2 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal/70 group-hover:text-Gold transition-colors"
              >
                Open Instagram
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}

"use client"

import React from "react"
import Image from "next/image"

export default function HowItWorksSection() {
  return (
    <section className="py-16 bg-Charcoal">
      <div className="mx-auto max-w-6xl px-4.5 grid grid-cols-1 md:grid-cols-[0.8fr_1fr_1fr] gap-8">
        <div className="flex flex-col justify-center">
          <h3 className="text-h3 text-Scroll mb-6 md:mb-14 max-w-[171px]">
            How It Works
          </h3>
          <p className="text-p-md text-Scroll max-w-[210px]">
            Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.
            Aliquam erat volutpat. Aliquam sed nisl at sem molestie condimentum.
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">
          {Array(2)
            .fill({})
            .map((_, i) => (
              <article key={i}>
                <Image
                  src="https://placehold.co/365x392/png"
                  alt="image"
                  className="object-cover w-full"
                  height={392}
                  width={365}
                />
                <h4 className="text-h6 text-Scroll font-bold uppercase mt-4 max-w-[200px] pl-3">
                  Ipsum Set Amet Header Here
                </h4>
              </article>
            ))}
        </div>
      </div>
    </section>
  )
}

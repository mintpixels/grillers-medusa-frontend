"use client"

import React from "react"
import Image from "next/image"

export default function BlogExploreSection() {
  return (
    <section className="py-10 md:py-[106px] bg-RichGold overflow-hidden">
      <div className="mx-auto max-w-7xl bg-Gold relative">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
          <div className="p-6 md:px-14 md:py-[70px]">
            <p className="text-h6 font-bold uppercase text-Scroll mb-3">
              Recipes &amp; Guides
            </p>

            <div className="h-[1px] w-[473px] bg-Scroll mb-5" />

            <h3 className="text-h2 text-Charcoal mb-12">
              Explore the Blog &amp; Get Cooking
            </h3>
            <div>
              <a href="#" className="btn-outline">
                <span> Get Cooking</span>
                <Image
                  src="/images/icons/arrow-right.svg"
                  width={20}
                  height={12}
                  alt=""
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          {/* Image */}
          <Image
            className="hidden md:block absolute -right-[70px] -top-[100px]"
            src={"/images/pages/home/Group368.png"}
            alt="quotes"
            width={259}
            height={650}
          />

          <Image
            src="/images/pages/home/Plate_Steak_Cut_Potatoes.png"
            alt="Delicious potatoes and steak"
            className="object-contain object-bottom max-w-[830px] aspect-[4/3] md:aspect-[5/4] absolute -right-[100px] -bottom-[106px] "
            width={830}
            height={650}
          />
        </div>
      </div>
    </section>
  )
}

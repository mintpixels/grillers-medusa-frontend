"use client"

import React, { useState } from "react"
import Image from "next/image"

import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

export default function ProductDetail({
  product,
  region,
  countryCode,
}: ProductTemplateProps) {
  const [quantity, setQuantity] = useState(1)

  const increment = () => setQuantity((q) => q + 1)
  const decrement = () => setQuantity((q) => Math.max(1, q - 1))

  const mockedProduct = {
    tag: "Kosher for Passover",
    title: "Kosher Organic Chicken Breasts",
    pricePerLb: 6.08,
    avgPackPrice: 6.69,
    avgPackWeight: 1.1,
    inStock: true,
    serves: "5–8",
    uncooked: true,
    piecesPerPack: 8,
    description:
      "Indulge in the richness of our Organic, Kosher Chicken Breasts, perfect for an unforgettable Shabbat dinner or Jewish festivities. Expertly pack weighing approximately 1.1 lb, each chicken breast is kosher, uncooked, and ready to be transformed into a mouth‑watering dish. Taste the kosher goodness of our premium chicken breasts now!",
    details: [
      { icon: "/images/icons/gluten-free.svg", label: "Gluten Free" },
      { icon: "/images/icons/lorem-ipsum.svg", label: "Lorem Ipsum" },
    ],
    certifications: [
      { icon: "/images/icons/dolor.svg", label: "Dolor" },
      { icon: "/images/icons/consectitur.svg", label: "Consectitur" },
    ],
    imageUrl: "https://placehold.co/750x750/png",
  }

  return (
    <section className="py-8 md:pt-8 md:pb-16 bg-Scroll relative">
      <div className="mx-auto max-w-7xl px-4.5 grid grid-cols-1 md:grid-cols-2 gap-8 ">
        {/* Left: product image + nav buttons */}
        <div>
          <div className="absolute w-[50vw] left-0 h-[calc(100%-98px)]">
            <Image
              src={mockedProduct.imageUrl}
              alt={mockedProduct.title}
              fill
              className="object-cover"
            />

            {/* Image nav */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <button className="h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition">
                <Image
                  src="/images/icons/arrow-left.svg"
                  width={12}
                  height={20}
                  alt="Prev"
                />
              </button>
              <button className="h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition">
                <Image
                  src="/images/icons/arrow-right.svg"
                  width={12}
                  height={20}
                  alt="Next"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right: product info */}
        <div className="flex flex-col max-w-[494px] ml-auto pt-4">
          {/* Tag + Title + Certification icon */}
          <div className="mb-6">
            <span className="bg-Black text-White text-p-sm px-2 py-1 rounded-full uppercase tracking-wide">
              {mockedProduct.tag}
            </span>
          </div>
          <div className="flex items-center justify-between mb-7">
            <h1 className="text-h3 text-Charcoal">{mockedProduct.title}</h1>
            <Image
              src="/images/pages/pdp/CertifiedKosher.png"
              width={90}
              height={90}
              alt="Certified Kosher"
            />
          </div>

          {/* Price & pack info */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] border-t border-b border-Charcoal mb-6">
            {/* price per lb */}
            <div className="border-r border-Charcoal py-6">
              <span className="text-h3 text-Charcoal">
                ${mockedProduct.pricePerLb.toFixed(2)}
              </span>
              <span className="text-p-sm-mono uppercase text-Charcoal pl-6">
                per lb
              </span>
            </div>

            {/* avg pack info */}
            <div className="flex flex-col items-end md:pl-8 mt-4 md:mt-0 py-6">
              <span className="text-p-sm-mono uppercase text-Charcoal">
                avg pack price:
                <span className="text-p-sm-bold text-Charcoal font-bold ml-1">
                  ${mockedProduct.avgPackPrice.toFixed(2)}
                </span>
              </span>
              <span className="text-p-sm-mono uppercase text-Charcoal mt-2">
                avg pack weight:
                <span className="text-p-sm-bold text-Charcoal font-bold ml-1">
                  {mockedProduct.avgPackWeight} lbs
                </span>
              </span>
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex flex-col md:flex-row items-center mb-6 gap-y-4 md:gap-y-0 md:gap-x-8">
            {/* qty selector */}
            <div className="flex border border-Charcoal h-full">
              <button
                onClick={decrement}
                className="px-4 text-Charcoal hover:bg-SilverPlate transition w-[50px]"
              >
                –
              </button>
              <span className="inline-flex items-center justify-center px-4 border-x border-Charcoal text-Charcoal w-[50px]">
                {quantity}
              </span>
              <button
                onClick={increment}
                className="px-4 text-Charcoal hover:bg-SilverPlate transition w-[50px]"
              >
                +
              </button>
            </div>

            {/* add to cart */}
            <button className="flex-1 btn-primary">
              Add to Cart – $
              {(mockedProduct.avgPackPrice * quantity).toFixed(2)}
            </button>
          </div>

          {/* Key product facts */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4 border-y border-Charcoal py-4">
            {mockedProduct.inStock && (
              <span className="inline-flex items-center">
                <Image
                  src="/images/icons/icon-circle-check.svg"
                  width={32}
                  height={32}
                  alt=""
                />
                <span className="ml-0.5 text-p-ex-sm-mono text-Charcoal">
                  In Stock
                </span>
              </span>
            )}
            <span className="inline-flex items-center">
              <Image
                src="/images/icons/icon-circle-check.svg"
                width={32}
                height={32}
                alt=""
              />
              <span className="ml-0.5 text-p-ex-sm-mono text-Charcoal">
                Serves {mockedProduct.serves}
              </span>
            </span>
            <span className="inline-flex items-center">
              <Image
                src="/images/icons/icon-circle-check.svg"
                width={32}
                height={32}
                alt=""
              />
              <span className="ml-0.5 text-p-ex-sm-mono text-Charcoal">
                Uncooked
              </span>
            </span>
            <span className="inline-flex items-center">
              <Image
                src="/images/icons/icon-circle-check.svg"
                width={32}
                height={32}
                alt=""
              />
              <span className="ml-0.5 text-p-ex-sm-mono text-Charcoal">
                {mockedProduct.piecesPerPack} pieces per pack
              </span>
            </span>
          </div>

          {/* Description */}
          <h2 className="text-p-sm-mono font-bold uppercase text-Charcoal pb-2">
            Description
          </h2>
          <p className="text-p-md text-Charcoal mb-8">
            {mockedProduct.description}
          </p>

          {/* Details & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-Charcoal">
            {/* Details */}
            <div className="border-r border-Charcoal pt-4">
              <h3 className="text-p-sm-mono font-bold uppercase text-Charcoal mb-4">
                Details
              </h3>
              <div className="flex space-x-9">
                {mockedProduct.details.map((d, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Image
                      src="/images/icons/icon-gluten free.svg"
                      width={48}
                      height={48}
                      alt={d.label}
                    />
                    <span className="text-p-sm-mono text-Charcoal mt-2">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="pt-4">
              <h3 className="text-p-sm-mono font-bold uppercase text-Charcoal mb-4">
                Certifications
              </h3>
              <div className="flex space-x-9">
                {mockedProduct.certifications.map((c, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Image
                      src="/images/icons/icon-gluten free.svg"
                      width={48}
                      height={48}
                      alt={c.label}
                    />
                    <span className="text-p-sm-mono text-Charcoal mt-2">
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import React from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
export default function BlogExploreSection({
  data,
}: {
  data: {
    CategoryLabel: string
    BlogExploreTitle: string
    Button: {
      Text: string
      Url: string
    }
    QuoteDecorImage: {
      url: string
    }
    MainImage: {
      url: string
    }
  }
}) {
  return (
    <section className="py-10 md:py-[106px] bg-RichGold overflow-hidden">
      <div className="mx-auto max-w-7xl bg-Gold relative">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
          <div className="p-6 md:px-14 md:py-[70px]">
            <p className="text-h6 font-bold uppercase text-Scroll mb-3">
              {data?.CategoryLabel}
            </p>
            <div className="h-[1px] w-[473px] bg-Scroll mb-5" />
            <h3 className="text-h2 text-Charcoal mb-12">
              {data?.BlogExploreTitle}
            </h3>
            {data?.Button?.Text && data?.Button?.Url && (
              <div>
                <LocalizedClientLink
                  href={data.Button.Url}
                  className="btn-outline"
                >
                  <span>{data.Button.Text}</span>
                  <Image
                    src="/images/icons/arrow-right.svg"
                    width={20}
                    height={12}
                    alt=""
                    aria-hidden="true"
                  />
                </LocalizedClientLink>
              </div>
            )}
          </div>

          {data?.QuoteDecorImage?.url && (
            <Image
              className="hidden md:block absolute -right-[70px] -top-[100px]"
              src={data.QuoteDecorImage.url}
              alt="quotes"
              width={259}
              height={650}
            />
          )}
          {data?.MainImage?.url && (
            <Image
              src={data.MainImage.url}
              alt="Delicious potatoes and steak"
              className="object-contain object-bottom max-w-[830px] aspect-[4/3] md:aspect-[5/4] absolute -right-[100px] -bottom-[106px] "
              width={830}
              height={650}
            />
          )}
        </div>
      </div>
    </section>
  )
}

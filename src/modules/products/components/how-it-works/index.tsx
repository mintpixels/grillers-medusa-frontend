"use client"

import React from "react"
import Image from "next/image"

export default function HowItWorksSection({
  data,
}: {
  data?: {
    Title: string
    Description: string
    Cards: {
      id: string
      Text: string
      Image?: {
        url: string
      } | null
    }[]
  } | null
}) {
  // Bail when Strapi common-PDP data hasn't been populated rather than
  // render an empty dark section with a hole where copy should be. #128.
  if (!data || (!data.Title && !data.Description && !data.Cards?.length)) {
    return null
  }

  const cards = data.Cards?.filter((card) => card?.Text) || []
  const labels = ["Order", "Cut", "Pack", "Deliver"]
  const fallbackSteps = [
    {
      id: "order",
      label: "Order",
      text: "Choose your cuts online and pick the checkout path that fits your region.",
    },
    {
      id: cards[0]?.id || "cut",
      label: "Cut",
      text:
        cards[0]?.Text ||
        "Hand-cut to spec in our Atlanta facility under AKC supervision.",
      image: cards[0]?.Image,
    },
    {
      id: cards[1]?.id || "pack",
      label: "Pack",
      text:
        cards[1]?.Text ||
        "Vacuum-sealed, deep-frozen, and packed for the trip from our plant to your table.",
      image: cards[1]?.Image,
    },
    {
      id: "deliver",
      label: "Deliver",
      text: "Metro Atlanta home delivery, scheduled Southeast city deliveries, plant pickup, or nationwide UPS in dry-ice insulated containers.",
    },
  ]
  const steps =
    cards.length >= 4
      ? cards.slice(0, 4).map((card, index) => ({
          id: card.id,
          label: labels[index],
          text: card.Text,
          image: card.Image,
        }))
      : fallbackSteps

  return (
    <section className="bg-Charcoal py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-8 border-y border-Scroll/25 py-8 md:grid-cols-[0.78fr_1.22fr] md:items-start md:gap-14 md:py-10">
          <div className="max-w-[520px]">
            <p className="mb-3 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-Gold">
              From counter to doorstep
            </p>
            {data.Title && (
              <h3 className="font-gyst text-h2-mobile text-Scroll md:text-h3">
                {data.Title}
              </h3>
            )}
            {data.Description && (
              <p className="mt-5 font-maison-neue text-p-md text-Scroll/90 md:max-w-[430px]">
                {data.Description}
              </p>
            )}
          </div>

          {steps.length > 0 && (
            <ol className="grid grid-cols-1 gap-3">
              {steps.map((step, index) => {
                const hasImage = Boolean(step.image?.url)

                return (
                  <li key={step.id}>
                    <article
                      className={
                        hasImage
                          ? "group grid border border-Scroll/25 bg-Black/15 transition-colors hover:border-Gold/70 sm:grid-cols-[180px_1fr]"
                          : "group border border-Scroll/25 bg-Black/15 transition-colors hover:border-Gold/70"
                      }
                    >
                      {step.image?.url && (
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-Black sm:aspect-auto sm:min-h-[140px]">
                          <Image
                            src={step.image.url}
                            alt={step.text}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                          />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="mb-5 flex items-center gap-3">
                          <span className="inline-flex size-9 items-center justify-center border border-Gold font-maison-neue-mono text-p-ex-sm-mono text-Gold">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-Gold">
                            {step.label}
                          </span>
                          <span className="h-px flex-1 bg-Scroll/25" />
                        </div>
                        <p className="font-maison-neue text-p-sm text-Scroll/95">
                          {step.text}
                        </p>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}

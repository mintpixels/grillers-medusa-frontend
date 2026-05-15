"use client"

import React from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Recipe = {
  documentId: string
  Title: string
  Slug: string
  Image?: {
    url: string
  } | null
  ShortDescription?: string | null
}

const getRecipeTeaser = (description?: string | null) => {
  if (!description) return null

  const normalized = description.replace(/\s+/g, " ").trim()
  const sentenceEnd = normalized.indexOf(".")

  return sentenceEnd >= 0 ? normalized.slice(0, sentenceEnd + 1) : normalized
}

export default function HowItFitsSection({
  recipes,
}: {
  recipes?: Recipe[] | null
}) {
  // Strapi product → Recipes is an optional relation. Bail entirely when
  // the product has no recipes attached — calling .map on undefined was
  // the actual cause of the PDP "Something went wrong" boundary on every
  // recipe-less SKU (#75).
  if (!recipes?.length) return null

  const visibleRecipes = recipes.slice(0, 3)
  const hasRecipeImages = visibleRecipes.some((recipe) => recipe?.Image?.url)

  return (
    <section className="bg-White py-12 md:py-20 border-y border-Charcoal/15">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-6 border-b border-Charcoal pb-8 md:grid-cols-[minmax(260px,0.8fr)_1fr] md:items-end md:gap-12 md:pb-10">
          <div>
            <p className="mb-3 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-RichGold">
              Cook this cut
            </p>
            <h3 className="font-gyst text-h2-mobile text-Charcoal md:text-h2">
              How It Fits On Your Table
            </h3>
          </div>

          <div className="flex flex-col gap-5 md:max-w-[520px] md:justify-self-end">
            <p className="font-maison-neue text-p-md text-Charcoal md:text-right">
              Recipes built around the cuts our customers cook most.
              From a Tuesday weeknight to Friday Shabbos.
            </p>
            <LocalizedClientLink
              href="/recipes"
              className="inline-flex h-11 items-center gap-3 self-start rounded-full border border-Charcoal px-5 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:bg-Charcoal hover:text-White md:self-end"
            >
              View all recipes
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
            </LocalizedClientLink>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-10 pt-8 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:pt-10">
          {visibleRecipes.map((recipe) => {
            const teaser = getRecipeTeaser(recipe.ShortDescription)
            const hasImage = Boolean(recipe?.Image?.url)

            return (
              <article
                key={recipe.documentId}
                aria-labelledby={`recipe-${recipe.documentId}-title`}
                className="group"
              >
                <LocalizedClientLink
                  href={`/recipes/${recipe.Slug}`}
                  className={
                    hasRecipeImages
                      ? "block"
                      : "flex h-full min-h-[260px] flex-col border-y border-Charcoal py-5 transition-colors hover:border-Crimson"
                  }
                >
                  {hasRecipeImages && (
                    <figure className="relative aspect-[4/3] w-full overflow-hidden border border-Charcoal/15 bg-Scroll">
                      {hasImage ? (
                        <Image
                          src={recipe.Image!.url}
                          alt={recipe.Title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                        />
                      ) : (
                        <div className="flex h-full flex-col justify-between bg-[linear-gradient(135deg,#F0F0ED_0%,#FFFFFF_58%,#E5B565_100%)] p-5">
                          <span className="font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-Charcoal/60">
                            Recipe
                          </span>
                          <span className="max-w-[18ch] font-gyst text-h4 font-bold leading-tight text-Charcoal">
                            {recipe.Title}
                          </span>
                        </div>
                      )}
                    </figure>
                  )}

                  <div className={hasRecipeImages ? "pt-5" : "flex h-full flex-col"}>
                    {!hasRecipeImages && (
                      <>
                        <span className="font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-Charcoal/60">
                          Recipe
                        </span>
                        <span className="mt-3 h-px w-14 bg-RichGold" />
                      </>
                    )}
                    <h4
                      id={`recipe-${recipe.documentId}-title`}
                      className={
                        hasRecipeImages
                          ? "border-b border-Charcoal pb-3 font-gyst text-h4 font-bold text-Charcoal transition-colors group-hover:text-Crimson"
                          : "mt-8 font-gyst text-h4 font-bold text-Charcoal transition-colors group-hover:text-Crimson"
                      }
                    >
                      {recipe.Title}
                    </h4>
                    {teaser && (
                      <p
                        className={
                          hasRecipeImages
                            ? "min-h-[86px] border-b border-Charcoal py-4 font-maison-neue text-p-sm text-Charcoal"
                            : "mt-4 font-maison-neue text-p-sm text-Charcoal"
                        }
                      >
                        {teaser}
                      </p>
                    )}
                    {!hasRecipeImages && (
                      <span className="mt-auto inline-flex items-center gap-2 pt-8 font-rexton text-h6 font-bold uppercase text-Charcoal">
                        Open recipe
                        <ArrowRight
                          aria-hidden="true"
                          size={15}
                          strokeWidth={1.75}
                        />
                      </span>
                    )}
                  </div>
                </LocalizedClientLink>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

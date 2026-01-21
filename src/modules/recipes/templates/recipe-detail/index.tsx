"use client"

import React from "react"
import NextImage from "next/image"
import SocialShare from "@modules/common/components/social-share"
import FavoriteButton from "@modules/recipes/components/favorite-button"
import VideoEmbed from "@modules/common/components/video-embed"

type Recipe = {
  Title: string
  Slug: string
  ShortDescription?: string
  Image?: { url: string }
  PublishedDate: string
  Servings: string
  PrepTime: string
  CookTime: string
  TotalTime: string
  Ingredients: { id: number; ingredient: string }[]
  Steps: { id: number; instruction: string }[]
  VideoUrl?: string
}

type RecipeTemplateProps = {
  recipe: Recipe
  isLoggedIn?: boolean
  isFavorited?: boolean
}

const PrintButton = () => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="print-hide inline-flex items-center gap-2 px-4 py-2 bg-Charcoal/5 hover:bg-Charcoal/10 text-Charcoal/70 hover:text-Charcoal rounded-[5px] transition-colors text-p-sm font-maison-neue"
      aria-label="Print this recipe"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print Recipe
    </button>
  )
}

const RecipeTemplate = ({ recipe, isLoggedIn = false, isFavorited = false }: RecipeTemplateProps) => {
  const {
    Title,
    Slug,
    ShortDescription,
    PublishedDate,
    PrepTime,
    CookTime,
    TotalTime,
    Servings,
    Ingredients,
    Steps,
    Image,
    VideoUrl,
  } = recipe

  return (
    <section className="py-10 md:py-16 bg-white text-Charcoal">
      <div className="mx-auto max-w-4xl px-4 recipe-print-container">
        <article className="space-y-12">
          {/* Header */}
          <header>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="text-h2 font-gyst text-Charcoal">{Title}</h1>
              <div className="print-hide flex items-center gap-3">
                <FavoriteButton
                  recipeSlug={Slug}
                  recipeTitle={Title}
                  initialFavorited={isFavorited}
                  isLoggedIn={isLoggedIn}
                  variant="button"
                />
                <PrintButton />
              </div>
            </div>
            <p className="mt-1 text-p-md font-maison-neue text-Charcoal/80">
              Published {new Date(PublishedDate).toLocaleDateString()}
            </p>
            {ShortDescription && (
              <p className="mt-6 text-p-lg font-maison-neue text-Charcoal">
                {ShortDescription}
              </p>
            )}
          </header>

          {/* Image */}
          {Image?.url && (
            <div className="w-full aspect-[3/2] relative rounded-[5px] overflow-hidden shadow-sm">
              <NextImage
                src={Image.url}
                alt={`Image of ${Title}`}
                fill
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Video */}
          {VideoUrl && (
            <section aria-labelledby="video-heading" className="print-hide">
              <h2
                id="video-heading"
                className="text-h3 font-gyst text-Charcoal mb-6"
              >
                Watch How It&apos;s Made
              </h2>
              <VideoEmbed url={VideoUrl} title={`How to make ${Title}`} />
            </section>
          )}

          {/* Stats */}
          <section aria-label="Recipe timing and serving info">
            <div className="recipe-stats grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-Charcoal py-4 text-center">
              {[
                { label: "Total Time", value: TotalTime },
                { label: "Prep Time", value: PrepTime },
                { label: "Cook Time", value: CookTime },
                { label: "Servings", value: Servings },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal">
                    {item.label}
                  </p>
                  <p className="text-p-sm-mono font-maison-neue-mono text-Charcoal">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Ingredients */}
          <section aria-labelledby="ingredients-heading">
            <h2
              id="ingredients-heading"
              className="text-h3 font-gyst text-Charcoal mb-6"
            >
              Ingredients
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              {Ingredients.map((item) => (
                <li
                  key={item.id}
                  className="text-p-md font-maison-neue text-Charcoal"
                >
                  {item.ingredient}
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section aria-labelledby="steps-heading">
            <h2
              id="steps-heading"
              className="text-h3 font-gyst text-Charcoal mb-6"
            >
              Preparation
            </h2>

            <dl className="space-y-8">
              {Steps?.map((step, index) => (
                <div key={step.id} className="">
                  <dt className="text-h4 font-gyst font-bold text-Charcoal pb-2">
                    Step {index + 1}:
                  </dt>
                  <dd className="text-p-md font-maison-neue text-Charcoal">
                    {step.instruction}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Social Share */}
          <section className="print-hide border-t border-Charcoal/20 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-p-md font-maison-neue text-Charcoal">
                Enjoyed this recipe? Share it with friends!
              </p>
              <SocialShare
                url={typeof window !== "undefined" ? window.location.href : `/recipes/${recipe.Slug}`}
                title={Title}
                description={ShortDescription || `Check out this delicious ${Title} recipe from Grillers Pride!`}
                imageUrl={Image?.url || ""}
              />
            </div>
          </section>
        </article>
      </div>
    </section>
  )
}

export default RecipeTemplate

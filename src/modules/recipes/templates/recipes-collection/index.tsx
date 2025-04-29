import React from "react"

import { default as NextImage } from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
const RecipesCollection = ({ recipes, page, pageInfo, countryCode }) => {
  const { pageCount, total } = pageInfo

  return (
    <div className="py-16 bg-Scroll">
      <div className="mx-auto max-w-7xl px-4.5">
        <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal mb-4 md:mb-8 text-center">
          Recipes
        </h1>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {recipes.map((recipe: any) => {
            return (
              <li key={recipe.documentId}>
                <LocalizedClientLink href={`/recipes/${recipe.Slug}`}>
                  <figure className="relative w-full aspect-square bg-gray-50 h-[552px]">
                    {recipe?.Image?.url && (
                      <NextImage
                        src={recipe.Image.url}
                        alt={recipe.Title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </figure>

                  <div className="pt-8">
                    <h4
                      id={`recipe-${recipe.documentId}-title`}
                      className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal mb-4"
                    >
                      {recipe.Title}
                    </h4>
                    <p className="text-p-sm font-maison-neue text-Charcoal pb-4 border-b border-Charcoal">
                      {recipe.ShortDescription}
                    </p>
                  </div>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>

        {/* Pagination */}
        <nav className="flex justify-center items-center space-x-4 mt-8 font-maison-neue text-h5 font-bold text-Charcoal">
          {page > 1 && (
            <LocalizedClientLink
              href={`/recipes?page=${page - 1}`}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ← Prev
            </LocalizedClientLink>
          )}
          <span>
            Page {page} of {pageCount} ({total} recipes)
          </span>
          {page < pageCount && (
            <LocalizedClientLink
              href={`/recipes?page=${page + 1}`}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next →
            </LocalizedClientLink>
          )}
        </nav>
      </div>
    </div>
  )
}

export default RecipesCollection

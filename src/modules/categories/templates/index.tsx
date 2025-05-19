"use client"

import React from "react"
import {
  InstantSearch,
  Hits,
  Configure,
  RefinementList,
  Pagination,
} from "react-instantsearch"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { searchLiteClient } from "@lib/algolia"
import { PRODUCT_INDEX } from "@lib/algolia/indexes"

// Attributes in Algolia for category filters
const CATEGORY_FILTER_ATTRIBUTES = [
  "Categorization.Aisle.Slug",
  "Categorization.ProductType.Slug",
  "Categorization.MasterCategory.Slug",
  "Categorization.Category.Slug",
  "Categorization.SubCategory.Slug",
] as const

interface CategoryTemplateProps {
  title: string
  slug: string[]
  countryCode: string
}

type Hit = any

// Product card component
const ProductCard = ({ hit }: { hit: Hit }) => (
  <article>
    <LocalizedClientLink
      href={`/products/${hit?.MedusaProduct?.Handle}`}
      className=""
    >
      <figure className="relative w-full aspect-square bg-gray-50">
        <Image
          src={hit?.FeaturedImage?.url}
          alt={hit.Title}
          fill
          className="object-cover"
        />
      </figure>

      <div className="py-8">
        <h4
          id={`hit-${hit.id}-title`}
          className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal"
        >
          {hit.Title}
        </h4>
        {hit?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber && (
          <p className="text-Charcoal py-7 border-b border-Charcoal">
            <span className="text-h3 font-gyst">
              ${hit.MedusaProduct.Variants[0].Price.CalculatedPriceNumber}
            </span>{" "}
            <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-2">
              per lb
            </span>
          </p>
        )}
        {hit?.MedusaProduct?.Description && (
          <p className="text-p-sm font-maison-neue text-black py-6">
            {hit.MedusaProduct.Description}
          </p>
        )}

        <p className="inline-flex gap-3 pt-3">
          <span className="text-Charcoal font-rexton text-h6 font-bold uppercase">
            View Details
          </span>
          <Image
            src={"/images/icons/arrow-right.svg"}
            width={20}
            height={12}
            alt="view details"
          />
        </p>
      </div>
    </LocalizedClientLink>
  </article>
)

// Styled Hits component
const StyledHits = () => (
  <Hits
    hitComponent={ProductCard}
    classNames={{
      list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
      item: "",
    }}
  />
)

// Styled RefinementList without title
const StyledRefinementList = ({
  attribute,
  customLabel,
}: {
  attribute: string
  customLabel?: string
}) => {
  const transformItems = (items: any) => {
    return items.map((item: any) => ({
      ...item,
      label: customLabel ?? item.label,
    }))
  }

  return (
    <RefinementList
      attribute={attribute}
      transformItems={transformItems}
      classNames={{
        list: "flex flex-col mb-1.5",
        item: "",
        label: "flex items-center text-p-sm text-Charcoal",
        checkbox: "form-checkbox h-4 w-4 text-VibrantRed mr-2",
        count: "ml-1 text-p-ex-sm-mono text-grey-50",
      }}
    />
  )
}

// Styled Pagination component
const StyledPagination = () => (
  <Pagination
    classNames={{
      list: "flex items-center space-x-2",
      item: "px-3 py-1 rounded-base border border-grey-20",
      link: "focus:outline-none",
      selectedItem: "bg-IsraelBlue text-white border-transparent",
      disabledItem: "opacity-50 cursor-not-allowed",
    }}
  />
)

export default function CategoryTemplate({
  title,
  slug,
  countryCode,
}: CategoryTemplateProps) {
  const filters = slug
    .map((value, idx) => `${CATEGORY_FILTER_ATTRIBUTES[idx]}:${value}`)
    .join(" AND ")

  return (
    <div className="py-12 content-container" data-testid="category-container">
      <InstantSearch searchClient={searchLiteClient} indexName={PRODUCT_INDEX}>
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-[0.25fr_1fr]">
          {/* Sidebar with styled facets */}
          <aside className="w-full space-y-6">
            <div>
              <h2 className="text-h4 font-gyst font-bold text-Charcoal mb-2">
                Dietary
              </h2>
              <StyledRefinementList
                attribute="Metadata.GlutenFree"
                customLabel="Gluten Free"
              />
              <StyledRefinementList
                attribute="Metadata.Uncooked"
                customLabel="Uncooked"
              />
              <StyledRefinementList
                attribute="Metadata.Cooked"
                customLabel="Cooked"
              />
            </div>
          </aside>

          {/* Product grid and pagination */}
          <main className="flex-1">
            <h1 className="text-h3 font-gyst text-Charcoal capitalize mb-8">
              {title}
            </h1>
            <Configure filters={filters} hitsPerPage={12} />
            <StyledHits />
            <div className="mt-8 flex justify-center">
              <StyledPagination />
            </div>
          </main>
        </div>
      </InstantSearch>
    </div>
  )
}

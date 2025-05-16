import { notFound } from "next/navigation"
import { Metadata } from "next"
import strapiClient from "@lib/strapi"
import { AllCategoryTreeQuery } from "@lib/data/strapi/categories"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"

interface AllCategoryTreeResponse {
  aisles: { Slug: string }[]
  productTypes: { Slug: string; Aisle: { Slug: string } }[]
  masterCategories: { Slug: string; ProductType: { Slug: string } }[]
  categories: { Slug: string; MasterCategory: { Slug: string } }[]
  subCategories: { Slug: string; Category: { Slug: string } }[]
}

interface CategoryPageParams {
  params: {
    countryCode: string
    handle: string[]
  }
}

type StaticCategoryParam = {
  countryCode: string
  handle: string[]
}

type MetadataProps = CategoryPageParams

export async function generateStaticParams(): Promise<StaticCategoryParam[]> {
  const { aisles, productTypes, masterCategories, categories, subCategories } =
    await strapiClient.request<AllCategoryTreeResponse>(AllCategoryTreeQuery)

  const aisleList = aisles.map((item) => ({ slug: item.Slug }))
  const productTypeList = productTypes.map((item) => ({
    slug: item.Slug,
    parentSlug: item.Aisle.Slug,
  }))
  const masterCategoryList = masterCategories.map((item) => ({
    slug: item.Slug,
    parentSlug: item.ProductType.Slug,
  }))
  const categoryList = categories.map((item) => ({
    slug: item.Slug,
    parentSlug: item.MasterCategory.Slug,
  }))
  const subCategoryList = subCategories.map((item) => ({
    slug: item.Slug,
    parentSlug: item.Category.Slug,
  }))

  // Build every valid prefix chain of length 1 to 5
  const prefixChains = new Set<string>()

  // Level 1: [aisle]
  aisleList.forEach(({ slug }) => {
    prefixChains.add(JSON.stringify([slug]))
  })

  // Level 2: [aisle, productType]
  productTypeList.forEach(({ parentSlug, slug }) => {
    prefixChains.add(JSON.stringify([parentSlug, slug]))
  })

  // Level 3: [aisle, productType, masterCategory]
  masterCategoryList.forEach(({ parentSlug, slug }) => {
    const productTypeItem = productTypeList.find(
      (typeItem) => typeItem.slug === parentSlug
    )
    if (productTypeItem) {
      prefixChains.add(
        JSON.stringify([productTypeItem.parentSlug, parentSlug, slug])
      )
    }
  })

  // Level 4: [aisle, productType, masterCategory, category]
  categoryList.forEach(({ parentSlug, slug }) => {
    const masterCategoryItem = masterCategoryList.find(
      (masterItem) => masterItem.slug === parentSlug
    )
    if (masterCategoryItem) {
      const productTypeItem = productTypeList.find(
        (typeItem) => typeItem.slug === masterCategoryItem.parentSlug
      )
      if (productTypeItem) {
        prefixChains.add(
          JSON.stringify([
            productTypeItem.parentSlug,
            masterCategoryItem.parentSlug,
            parentSlug,
            slug,
          ])
        )
      }
    }
  })

  // Level 5: [aisle, productType, masterCategory, category, subCategory]
  subCategoryList.forEach(({ parentSlug, slug }) => {
    const categoryItem = categoryList.find(
      (categoryEntry) => categoryEntry.slug === parentSlug
    )
    if (categoryItem) {
      const masterCategoryItem = masterCategoryList.find(
        (masterEntry) => masterEntry.slug === categoryItem.parentSlug
      )
      if (masterCategoryItem) {
        const productTypeItem = productTypeList.find(
          (typeEntry) => typeEntry.slug === masterCategoryItem.parentSlug
        )
        if (productTypeItem) {
          prefixChains.add(
            JSON.stringify([
              productTypeItem.parentSlug,
              masterCategoryItem.parentSlug,
              categoryItem.parentSlug,
              parentSlug,
              slug,
            ])
          )
        }
      }
    }
  })

  const paths: string[][] = Array.from(prefixChains).map((chain) =>
    JSON.parse(chain)
  )

  const regions: StoreRegion[] = await listRegions()
  const countryCodes: string[] = regions
    .flatMap((reg) => reg.countries ?? [])
    .map((c) => c.iso_2)
    .filter((code): code is string => typeof code === "string")

  return countryCodes.flatMap((code) =>
    paths.map((handle) => ({ countryCode: code, handle }))
  )
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { handle } = params
  try {
    const title = handle
      .map((segment) => segment.replace(/-/g, " "))
      .join(" / ")
    return { title }
  } catch (error) {
    notFound()
  }
}

export default function CategoryPage({ params }: CategoryPageParams) {
  const { countryCode, handle } = params

  if (!handle || handle.length === 0) {
    return notFound()
  }

  const title = handle.map((segment) => segment.replace(/-/g, " ")).join(" / ")

  return (
    <CategoryTemplate title={title} slug={handle} countryCode={countryCode} />
  )
}

export const dynamic = "force-dynamic"

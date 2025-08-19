import { Metadata } from "next"
import { notFound } from "next/navigation"
import strapiClient from "@lib/strapi"

import {
  AllProductCollectionsQuery,
  GetProductCollectionQuery,
} from "@lib/data/strapi/collections"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import CollectionTemplate from "@modules/collections/templates"

interface AllProductCollectionsResponse {
  productCollections: { Slug: string }[]
}

interface GetProductCollectionResponse {
  productCollections: { Name: string }[]
}

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

type StaticParams = {
  countryCode: string
  handle: string
}

export async function generateStaticParams(): Promise<StaticParams[]> {
  const { productCollections } =
    await strapiClient.request<AllProductCollectionsResponse>(
      AllProductCollectionsQuery
    )

  if (!productCollections) {
    return []
  }

  const countryCodes = await listRegions().then(
    (regions: StoreRegion[]) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  const productCollectionsHandles = productCollections.map(
    (collection) => collection.Slug
  )

  const staticParams = countryCodes
    ?.map((countryCode: string) =>
      productCollectionsHandles.map((handle: string) => ({
        countryCode,
        handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params

  if (!handle) {
    notFound()
  }

  const metadata = {
    title: `${handle} | Medusa Store`,
    description: `${handle} collection`,
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const params = await props.params
  const { countryCode, handle } = params

  if (!handle || handle.length === 0) {
    return notFound()
  }

  const res = await strapiClient.request<GetProductCollectionResponse>(
    GetProductCollectionQuery
  )
  const collection = res?.productCollections?.[0]

  if (!collection) {
    return notFound()
  }

  return (
    <CollectionTemplate
      title={collection.Name}
      slug={handle}
      countryCode={countryCode}
    />
  )
}

export const dynamic = "force-dynamic"

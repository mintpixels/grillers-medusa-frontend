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

interface ProductCollection {
  Name: string
  Slug: string
}

interface GetProductCollectionResponse {
  productCollections: ProductCollection[]
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
  const { handle, countryCode } = params

  if (!handle) {
    notFound()
  }

  // Fetch collection data for metadata
  const res = await strapiClient.request<GetProductCollectionResponse>(
    GetProductCollectionQuery,
    { handle }
  )
  const collection = res?.productCollections?.[0]

  if (!collection) {
    return {
      title: "Collection Not Found | Grillers",
      description: "The requested collection could not be found.",
    }
  }

  // Generate SEO-optimized content from available data
  const formattedName = collection.Name
  const title = `${formattedName} | Griller's Pride`
  
  const description = `Shop our ${formattedName} collection of premium kosher meats. Fresh, high-quality cuts delivered to your door. 100% kosher certified, expertly prepared, and ready for your grill.`

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillers.com"
  const canonicalUrl = `${baseUrl}/${countryCode}/collections/${handle}`
  
  // Generate relevant keywords based on collection name
  const keywords = `${formattedName}, kosher meat, kosher ${formattedName.toLowerCase()}, premium meat, grillers, kosher certified, ${formattedName.toLowerCase()} delivery, fresh ${formattedName.toLowerCase()}`
  
  const metadata: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "Grillers",
      // Use a default collection image - could be customized per collection slug
      images: [
        {
          url: `${baseUrl}/images/pages/collections/${handle}.jpg`,
          width: 1200,
          height: 630,
          alt: formattedName,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@grillers",
      images: [`${baseUrl}/images/pages/collections/${handle}.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  }

  return metadata
}

function generateCollectionJsonLd(collection: ProductCollection, countryCode: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillers.com"
  const canonicalUrl = `${baseUrl}/${countryCode}/collections/${collection.Slug}`
  const description = `Shop our ${collection.Name} collection of premium kosher meats. Fresh, high-quality cuts delivered to your door.`
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": collection.Name,
    "description": description,
    "url": canonicalUrl,
    "image": `${baseUrl}/images/pages/collections/${collection.Slug}.jpg`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `${baseUrl}/${countryCode}`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Collections",
          "item": `${baseUrl}/${countryCode}/collections`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": collection.Name,
          "item": canonicalUrl
        }
      ]
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": collection.Name,
      "description": description,
      "numberOfItems": 12 // This could be dynamic based on actual product count
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "Grillers",
      "url": `${baseUrl}`
    }
  }
}

export default async function CollectionPage(props: Props) {
  const params = await props.params
  const { countryCode, handle } = params

  if (!handle || handle.length === 0) {
    return notFound()
  }

  const res = await strapiClient.request<GetProductCollectionResponse>(
    GetProductCollectionQuery,
    { handle }
  )
  const collection = res?.productCollections?.[0]

  if (!collection) {
    return notFound()
  }

  const jsonLd = generateCollectionJsonLd(collection, countryCode)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionTemplate
        title={collection.Name}
        slug={handle}
        countryCode={countryCode}
      />
    </>
  )
}

export const dynamic = "force-dynamic"

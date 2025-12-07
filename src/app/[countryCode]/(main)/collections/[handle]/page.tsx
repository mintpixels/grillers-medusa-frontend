import { Metadata } from "next"
import { notFound } from "next/navigation"
import strapiClient from "@lib/strapi"

import {
  AllProductCollectionsQuery,
  GetProductCollectionQuery,
  type ProductCollectionData,
} from "@lib/data/strapi/collections"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import CollectionTemplate from "@modules/collections/templates"

interface AllProductCollectionsResponse {
  productCollections: { Slug: string }[]
}

interface GetProductCollectionResponse {
  productCollections: ProductCollectionData[]
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

  const res = await strapiClient.request<GetProductCollectionResponse>(
    GetProductCollectionQuery,
    { handle }
  )
  const collection = res?.productCollections?.[0]

  if (!collection) {
    return {
      title: "Collection Not Found | Grillers Pride",
      description: "The requested collection could not be found.",
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const canonicalUrl = `${baseUrl}/${countryCode}/collections/${handle}`

  // Use Strapi SEO data if available, otherwise generate from collection name
  const seo = collection.SEO
  const socialMeta = collection.SocialMeta

  const title = seo?.metaTitle || `${collection.Name} | Grillers Pride`
  const description =
    seo?.metaDescription ||
    `Shop our ${collection.Name} collection of premium kosher meats. Fresh, high-quality cuts delivered to your door. 100% kosher certified.`

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialMeta?.ogTitle || title,
      description: socialMeta?.ogDescription || description,
      type: (socialMeta?.ogType as any) || "website",
      url: canonicalUrl,
      siteName: "Grillers Pride",
      images: socialMeta?.ogImage?.url
        ? [
            {
              url: socialMeta.ogImage.url,
              alt: socialMeta.ogImageAlt || collection.Name,
            },
          ]
          : undefined,
    },
    twitter: {
      card: (socialMeta?.twitterCard as any) || "summary_large_image",
      title: socialMeta?.twitterTitle || title,
      description: socialMeta?.twitterDescription || description,
      images: socialMeta?.twitterImage?.url
        ? [socialMeta.twitterImage.url]
        : undefined,
      site: socialMeta?.twitterSite,
      creator: socialMeta?.twitterCreator,
    },
    robots: {
      index: true,
      follow: true,
    },
  }

  return metadata
}

function generateCollectionJsonLd(
  collection: ProductCollectionData,
  countryCode: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const canonicalUrl = `${baseUrl}/${countryCode}/collections/${collection.Slug}`
  const description =
    collection.SEO?.metaDescription ||
    `Shop our ${collection.Name} collection of premium kosher meats.`

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.Name,
    description: description,
    url: canonicalUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${baseUrl}/${countryCode}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Collections",
          item: `${baseUrl}/${countryCode}/collections`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: collection.Name,
          item: canonicalUrl,
        },
      ],
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Grillers Pride",
      url: `${baseUrl}`,
    },
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

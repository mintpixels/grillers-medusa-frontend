import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import strapiClient from "@lib/strapi"

import {
  GetProductCollectionQuery,
  type ProductCollectionData,
  getProductTagBySlug,
  extractTagValue,
  getProductsByTag,
  getProductsByCollectionSlug,
  type StrapiCollectionProduct,
} from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import CollectionTemplate from "@modules/collections/templates"
import CuratedCollectionTemplate from "@modules/collections/templates/curated-collection"
import { getBaseURL } from "@lib/util/env"
import { retrieveCustomer } from "@lib/data/customer"
import { listPurchaseHistory } from "@lib/data/orders"
import { compactCollectionProducts } from "@lib/util/collection-product"
import { withTimeout } from "@lib/util/promise-timeout"
import {
  getCuratedCollectionBySlug,
  type CuratedCollection,
} from "@lib/data/strapi/curated-collections"

interface GetProductCollectionResponse {
  productCollections: ProductCollectionData[]
}

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
}

const getCuratedCollectionForPage = cache(
  (handle: string, countryCode: string) =>
    getCuratedCollectionBySlug(handle, countryCode)
)

const getProductCollectionForPage = cache(async (handle: string) => {
  const res = await strapiClient.request<GetProductCollectionResponse>(
    GetProductCollectionQuery,
    { handle }
  )

  return res?.productCollections?.[0] || null
})

const getProductTagForPage = cache((handle: string) =>
  getProductTagBySlug(handle, strapiClient)
)

const getCollectionProductsForPage = cache((handle: string) =>
  getProductsByCollectionSlug(handle, strapiClient)
)

const getTagProductsForPage = cache((tagName: string) =>
  getProductsByTag(tagName, strapiClient)
)

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params

  if (!handle) {
    notFound()
  }

  const curated = await getCuratedCollectionForPage(handle, countryCode)
  if (curated) {
    const baseUrl = getBaseURL()
    const canonicalUrl = `${baseUrl}/${countryCode}/collections/${handle}`
    const seo = curated.SEO
    const socialMeta = curated.SocialMeta
    const title = seo?.metaTitle || `${curated.Name} | Grillers Pride`
    const description = seo?.metaDescription || curated.ShortDescription

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
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
                alt: socialMeta.ogImageAlt || curated.Name,
              },
            ]
          : curated.HeroImage?.url
            ? [
                {
                  url: curated.HeroImage.url,
                  alt: curated.HeroImageAlt || curated.Name,
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
          : curated.HeroImage?.url
            ? [curated.HeroImage.url]
            : undefined,
        site: socialMeta?.twitterSite,
        creator: socialMeta?.twitterCreator,
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }

  let collection = await getProductCollectionForPage(handle)
  let tag: any = null

  // If not found as collection, check if it's a product tag
  if (!collection) {
    tag = await getProductTagForPage(handle)

    if (tag) {
      const tagValue = extractTagValue(tag.Name)
      collection = {
        Name: `Kosher ${tagValue}`,
        Slug: handle,
        Description: tag.Description || `Browse our Kosher ${tagValue} products`,
      } as ProductCollectionData
    } else {
      return {
        title: "Collection Not Found | Grillers Pride",
        description: "The requested collection could not be found.",
      }
    }
  }

  const baseUrl = getBaseURL()
  const canonicalUrl = `${baseUrl}/${countryCode}/collections/${handle}`

  const seo = collection.SEO
  const socialMeta = collection.SocialMeta
  const tagSEODescription = tag ? tag.SEODescription || "" : ""

  const title = seo?.metaTitle || `${collection.Name} | Grillers Pride`
  const description =
    seo?.metaDescription ||
    tagSEODescription ||
    collection.Description ||
    `Shop our ${collection.Name} collection of premium kosher meats. Fresh, high-quality cuts delivered to your door. 100% kosher certified.`

  return {
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
}

function generateCollectionJsonLd(
  collection: ProductCollectionData,
  countryCode: string
) {
  const baseUrl = getBaseURL()
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

function generateCuratedCollectionJsonLd(
  collection: CuratedCollection,
  countryCode: string
) {
  const baseUrl = getBaseURL()
  const canonicalUrl = `${baseUrl}/${countryCode}/collections/${collection.Slug}`

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.Name,
    description: collection.SEO?.metaDescription || collection.ShortDescription,
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
  }
}

export default async function CollectionPage(props: Props) {
  const params = await props.params
  const { countryCode, handle } = params

  if (!handle || handle.length === 0) {
    return notFound()
  }

  const curated = await getCuratedCollectionForPage(handle, countryCode)
  if (curated) {
    const jsonLd = generateCuratedCollectionJsonLd(curated, countryCode)
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CuratedCollectionTemplate
          collection={curated}
          countryCode={countryCode}
        />
      </>
    )
  }

  const customerPromise = withTimeout(
    retrieveCustomer().catch(() => null),
    1000,
    null,
    `collection customer lookup for ${handle}`
  )

  // First, try to get as a ProductCollection
  const res = await withTimeout(
    getProductCollectionForPage(handle),
    1500,
    null,
    `collection metadata for ${handle}`
  )
  let collection = res
  let products: StrapiCollectionProduct[] = []

  if (collection) {
    // Fetch products assigned to this collection
    products = await withTimeout(
      getCollectionProductsForPage(handle),
      3000,
      [],
      `collection products for ${handle}`
    )
  } else {
    // Check if it's a product tag
    const tag = await withTimeout(
      getProductTagForPage(handle),
      1500,
      null,
      `collection tag lookup for ${handle}`
    )

    if (tag) {
      const tagValue = extractTagValue(tag.Name)

      products = await withTimeout(
        getTagProductsForPage(tag.Name),
        3000,
        [],
        `tag products for ${handle}`
      )

      collection = {
        Name: `Kosher ${tagValue}`,
        Slug: handle,
        Description: tag.Description || `Browse our Kosher ${tagValue} products`,
      } as ProductCollectionData
    } else {
      return notFound()
    }
  }

  const recentProductIdsPromise = customerPromise.then(async (customer) => {
    if (!customer) return []
    return Array.from(
      new Set(
        (
          await withTimeout(
            listPurchaseHistory().catch(() => []),
            1200,
            [],
            `collection purchase history for ${handle}`
          )
        )
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id))
      )
    )
  })

  // Strapi caches a CalculatedPriceNumber via a sync workflow that can lag.
  // Always overlay live Medusa prices so cards (grid + list) display the
  // current price regardless of Strapi sync state.
  const [enrichedProducts, recentProductIds] = await Promise.all([
    withTimeout(
      enrichStrapiProductsWithMedusaPrices(products, countryCode).catch(
        () => products
      ),
      1200,
      products,
      `collection price enrichment for ${handle}`
    ),
    recentProductIdsPromise,
  ])
  products = enrichedProducts

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
        collection={collection}
        products={compactCollectionProducts(products)}
        recentProductIds={recentProductIds}
      />
    </>
  )
}

export const dynamic = "force-dynamic"

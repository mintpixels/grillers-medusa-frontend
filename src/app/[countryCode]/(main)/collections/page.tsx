import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { generateAlternates } from "@lib/util/seo"
import {
  getCuratedCollections,
  type CuratedCollection,
} from "@lib/data/strapi/curated-collections"
import CollectionsHub from "@modules/collections/templates/collections-hub"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

const title = "Shop Collections | Grillers Pride"
const description =
  "Browse curated kosher meat collections built around first orders, Shabbos tables, freezer stocking, local delivery, and cold-chain shipping."

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  const alternates = await generateAlternates("/collections", countryCode)
  const url = `${getBaseURL()}/${countryCode}/collections`

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Grillers Pride",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

function dedupeCollections(collections: CuratedCollection[]) {
  const seen = new Set<string>()
  const result: CuratedCollection[] = []

  for (const collection of collections) {
    const key = collection.documentId || collection.Slug
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(collection)
  }

  return result.sort((a, b) => (a.SortOrder || 999) - (b.SortOrder || 999))
}

async function getCollections(countryCode: string) {
  const [guestCollections, returningCollections] = await Promise.all([
    getCuratedCollections({
      countryCode,
      customerState: "guest_or_no_orders",
      limit: 60,
    }),
    getCuratedCollections({
      countryCode,
      customerState: "returning",
      limit: 60,
    }),
  ])

  return dedupeCollections([...guestCollections, ...returningCollections])
}

export default async function CollectionsPage({ params }: PageProps) {
  const { countryCode } = await params
  const collections = await getCollections(countryCode)
  const pageUrl = `${getBaseURL()}/${countryCode}/collections`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shop Collections",
    description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Grillers Pride",
      url: getBaseURL(),
    },
    hasPart: collections.map((collection) => ({
      "@type": "CollectionPage",
      name: collection.Name,
      url: `${getBaseURL()}/${countryCode}/collections/${collection.Slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionsHub collections={collections} countryCode={countryCode} />
    </>
  )
}

export const dynamic = "force-dynamic"

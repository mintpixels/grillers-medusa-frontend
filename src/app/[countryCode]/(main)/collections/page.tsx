import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { generateAlternates } from "@lib/util/seo"
import CollectionsHub from "@modules/collections/templates/collections-hub"
import {
  isCollectionOccasion,
  isWaysToShopMissionId,
} from "@lib/content/ways-to-shop"
import { getCuratedCollectionCards } from "@lib/data/strapi/curated-collections"
import { withCuratedCollectionsTimeoutAlert } from "@lib/curated-collections-ops-alerts"
import ExperimentExposure from "@lib/experiments/exposure"
import { getExperimentAssignment } from "@lib/experiments/server"
import { itemListJsonLd, webPageJsonLd } from "@lib/util/structured-data"

type PageProps = {
  params: Promise<{ countryCode: string }>
  searchParams?: Promise<{ mission?: string; occasion?: string }>
}

const title = "Shop Collections | Grillers Pride"
const description =
  "Browse curated kosher meat collections built around first orders, Shabbos tables, freezer stocking, local delivery, and cold-chain shipping."

export function generateStaticParams() {
  return [{ countryCode: "us" }]
}

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

export default async function CollectionsPage({
  params,
  searchParams,
}: PageProps) {
  const { countryCode } = await params
  const resolvedSearchParams = await searchParams
  const missionParam = resolvedSearchParams?.mission
  const occasionParam = resolvedSearchParams?.occasion
  const activeMissionId = isWaysToShopMissionId(missionParam)
    ? missionParam
    : null
  const activeOccasion =
    !activeMissionId && isCollectionOccasion(occasionParam)
      ? occasionParam
      : null
  const pageUrl = `${getBaseURL()}/${countryCode}/collections`
  const collectionsExperiment = await getExperimentAssignment(
    "collections_entrypoints_v1",
    {
      routeMarket: countryCode,
      customerType: "unknown",
    }
  )
  const collections = await withCuratedCollectionsTimeoutAlert({
    promise: getCuratedCollectionCards({
      alertSurface: "collections_hub",
      customerState: "any",
      limit: 60,
    }).catch(() => []),
    fallback: [],
    operation: "cards",
    surface: "collections_hub",
    countryCode,
    customerState: "any",
    limit: 60,
    timeoutMs: 1200,
  })
  const baseUrl = getBaseURL()
  const collectionListJsonLd = itemListJsonLd(
    baseUrl,
    countryCode,
    "Grillers Pride collections",
    collections
      .filter((collection) => collection.Slug)
      .slice(0, 60)
      .map((collection) => ({
        type: "CollectionPage",
        name: collection.Name,
        path: `/collections/${collection.Slug}`,
        description: collection.ShortDescription,
        image: collection.HeroImage?.url,
      }))
  )
  const jsonLd = webPageJsonLd({
    baseUrl,
    countryCode,
    path: "/collections",
    name: "Shop Collections",
    description,
    type: "CollectionPage",
    breadcrumbs: [{ name: "Collections", path: "/collections" }],
    mainEntity: collectionListJsonLd,
  })

  return (
    <>
      <ExperimentExposure assignment={collectionsExperiment} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionsHub
        collections={collections}
        countryCode={countryCode}
        activeMissionId={activeMissionId}
        activeOccasion={activeOccasion}
      />
    </>
  )
}

export const revalidate = 300

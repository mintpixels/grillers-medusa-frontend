import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { generateAlternates } from "@lib/util/seo"
import CollectionsHub from "@modules/collections/templates/collections-hub"
import {
  isCollectionOccasion,
  isWaysToShopMissionId,
} from "@lib/content/ways-to-shop"
import { getCuratedCollectionCards } from "@lib/data/strapi/curated-collections"
import ExperimentExposure from "@lib/experiments/exposure"
import { getExperimentAssignment } from "@lib/experiments/server"
import { withTimeout } from "@lib/util/promise-timeout"

type PageProps = {
  params: Promise<{ countryCode: string }>
  searchParams?: Promise<{ mission?: string; occasion?: string }>
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
  const collections = await withTimeout(
    getCuratedCollectionCards({
      customerState: "any",
      limit: 60,
    }).catch(() => []),
    1200,
    [],
    "collections hub cards"
  )
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
  }

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

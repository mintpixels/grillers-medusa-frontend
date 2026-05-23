import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { generateAlternates } from "@lib/util/seo"
import ButcherEducationHub from "@modules/learn/templates/butcher-education-hub"
import { isWaysToShopMissionId } from "@lib/content/ways-to-shop"

type PageProps = {
  params: Promise<{ countryCode: string }>
  searchParams?: Promise<{ mission?: string }>
}

const title = "The Butcher Guide | Grillers Pride"
const description =
  "Kosher meat education, kashruth supervision, cut guidance, and practical buying advice from the Grillers Pride butcher counter."

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  const alternates = await generateAlternates("/learn", countryCode)
  const url = `${getBaseURL()}/${countryCode}/learn`

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
      images: [
        {
          url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_card_1_40c3310173.jpg",
          alt: "Kosher meat prepared at the Grillers Pride butcher counter.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_card_1_40c3310173.jpg",
      ],
    },
  }
}

export default async function LearnPage({ params, searchParams }: PageProps) {
  const { countryCode } = await params
  const resolvedSearchParams = await searchParams
  const missionParam = resolvedSearchParams?.mission
  const activeMissionId = isWaysToShopMissionId(missionParam)
    ? missionParam
    : null
  const pageUrl = `${getBaseURL()}/${countryCode}/learn`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Butcher Guide",
    description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Grillers Pride",
      url: getBaseURL(),
    },
    about: [
      "Kosher meat",
      "Kashruth supervision",
      "Butcher cut library",
      "Kosher cooking guidance",
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ButcherEducationHub
        countryCode={countryCode}
        activeMissionId={activeMissionId}
      />
    </>
  )
}

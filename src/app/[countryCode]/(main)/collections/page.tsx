import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { generateAlternates } from "@lib/util/seo"
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

export default async function CollectionsPage({ params }: PageProps) {
  const { countryCode } = await params
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
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionsHub countryCode={countryCode} />
    </>
  )
}

export const revalidate = 300

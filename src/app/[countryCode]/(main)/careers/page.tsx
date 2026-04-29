import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getInfoPage } from "@lib/data/strapi/legal"
import InfoPageTemplate from "@modules/info/templates/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getInfoPage("careers")
  return {
    title: `${page?.Title || "Careers"} | Grillers Pride`,
    description:
      page?.SEO?.metaDescription ||
      "Open roles at Grillers Pride — Doraville, GA.",
  }
}

export default async function CareersPage() {
  const page = await getInfoPage("careers")
  if (!page) notFound()

  return <InfoPageTemplate page={page} section="About" />
}

export const dynamic = "force-dynamic"

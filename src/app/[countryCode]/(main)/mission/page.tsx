import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getInfoPage } from "@lib/data/strapi/legal"
import InfoPageTemplate from "@modules/info/templates/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getInfoPage("mission")
  return {
    title: `${page?.Title || "Our Mission"} | Grillers Pride`,
    description:
      page?.SEO?.metaDescription ||
      "What we stand for and the standards behind every cut.",
  }
}

export default async function MissionPage() {
  const page = await getInfoPage("mission")
  if (!page) notFound()

  return <InfoPageTemplate page={page} section="About" />
}

export const dynamic = "force-dynamic"

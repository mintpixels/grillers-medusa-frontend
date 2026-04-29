import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getInfoPage } from "@lib/data/strapi/legal"
import InfoPageTemplate from "@modules/info/templates/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getInfoPage("about")
  return {
    title: `${page?.Title || "About Us"} | Grillers Pride`,
    description:
      page?.SEO?.metaDescription ||
      "Family-run kosher butcher counter in Doraville, GA — AKC-supervised since 2002.",
  }
}

export default async function AboutPage() {
  const page = await getInfoPage("about")
  if (!page) notFound()

  return <InfoPageTemplate page={page} section="About" />
}

export const dynamic = "force-dynamic"

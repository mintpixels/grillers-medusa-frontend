import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getInfoPage } from "@lib/data/strapi/legal"
import InfoPageTemplate from "@modules/info/templates/info-page"

const VALID = new Set(["passover", "hechsherim", "supervision"])

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateStaticParams() {
  return Array.from(VALID).map((slug) => ({ slug }))
}

function strapiSlug(slug: string) {
  return `kashruth-${slug}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!VALID.has(slug)) return { title: "Not Found | Grillers Pride" }
  const page = await getInfoPage(strapiSlug(slug))
  return {
    title: `${page?.Title || "Kashruth"} | Grillers Pride`,
    description:
      page?.SEO?.metaDescription ||
      `${page?.Title} — kashruth, supervision, and Passover details from Grillers Pride.`,
  }
}

export default async function KashruthInfoPage({ params }: Props) {
  const { slug } = await params
  if (!VALID.has(slug)) notFound()

  const page = await getInfoPage(strapiSlug(slug))
  if (!page) notFound()

  return (
    <InfoPageTemplate
      page={page}
      section="Kashruth"
      backHref="/customer-service"
      backLabel="Back to customer service"
    />
  )
}

export const dynamic = "force-dynamic"

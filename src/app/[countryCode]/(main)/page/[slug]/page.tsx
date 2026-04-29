import { Metadata } from "next"
import { notFound } from "next/navigation"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import {
  getInfoPage,
  getLegalPage,
  isLegalSlug,
  LEGAL_SLUGS,
} from "@lib/data/strapi/legal"
import InfoPageTemplate from "@modules/info/templates/info-page"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

const INFO_SLUGS = ["about-us", "our-mission", "careers"] as const
type InfoSlug = (typeof INFO_SLUGS)[number]

const VALID_SLUGS = new Set<string>([...LEGAL_SLUGS, ...INFO_SLUGS])

const SECTION_BY_SLUG: Record<InfoSlug, string> = {
  "about-us": "About",
  "our-mission": "About",
  careers: "About",
}

export async function generateStaticParams() {
  return Array.from(VALID_SLUGS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!VALID_SLUGS.has(slug)) {
    return { title: "Not Found | Grillers Pride" }
  }
  const page = isLegalSlug(slug)
    ? await getLegalPage(slug)
    : await getInfoPage(slug)
  const title = page?.SEO?.metaTitle || `${page?.Title} | Grillers Pride`
  return {
    title,
    description:
      page?.SEO?.metaDescription ||
      `Read ${page?.Title} from Grillers Pride.`,
  }
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params
  if (!VALID_SLUGS.has(slug)) notFound()

  if (isLegalSlug(slug)) {
    const page = await getLegalPage(slug)
    if (!page) notFound()

    const updated = page.UpdatedAt
      ? new Date(page.UpdatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null

    return (
      <div className="content-container py-12 md:py-16">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8 pb-6 border-b border-Charcoal/10">
            <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
              {page.Title}
            </h1>
            {updated && (
              <p className="mt-3 text-p-sm text-Charcoal/60">
                Last updated: {updated}
              </p>
            )}
          </header>

          <div className="prose prose-Charcoal max-w-none font-maison-neue text-Charcoal/90 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-gyst [&_h3]:text-Charcoal [&_a]:text-Gold [&_a:hover]:text-Gold/80">
            <BlocksRenderer content={page.Content} />
          </div>
        </article>
      </div>
    )
  }

  const page = await getInfoPage(slug)
  if (!page) notFound()
  return (
    <InfoPageTemplate
      page={page}
      section={SECTION_BY_SLUG[slug as InfoSlug]}
    />
  )
}

export const dynamic = "force-dynamic"

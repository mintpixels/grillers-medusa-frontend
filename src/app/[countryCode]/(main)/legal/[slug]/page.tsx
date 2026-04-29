import { Metadata } from "next"
import { notFound } from "next/navigation"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import { getLegalPage, isLegalSlug, LEGAL_SLUGS } from "@lib/data/strapi/legal"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!isLegalSlug(slug)) {
    return { title: "Not Found | Grillers Pride" }
  }
  const page = await getLegalPage(slug)
  const title = page?.SEO?.metaTitle || `${page?.Title} | Grillers Pride`
  return {
    title,
    description:
      page?.SEO?.metaDescription ||
      `Read the ${page?.Title} for Grillers Pride.`,
  }
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params
  if (!isLegalSlug(slug)) notFound()

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
          <p className="mt-3 text-xs text-Charcoal/50 italic">
            Placeholder copy — final document pending legal review.
          </p>
        </header>

        <div className="prose prose-Charcoal max-w-none font-maison-neue text-Charcoal/90 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-gyst [&_h3]:text-Charcoal [&_a]:text-Gold [&_a:hover]:text-Gold/80">
          <BlocksRenderer content={page.Content} />
        </div>
      </article>
    </div>
  )
}

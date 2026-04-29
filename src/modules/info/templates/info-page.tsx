import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { LegalPageData } from "@lib/data/strapi/legal"

type Props = {
  page: LegalPageData
  // Section eyebrow shown above the title (e.g. "SHIPPING", "KASHRUTH").
  // Optional — falls back to nothing if not provided.
  section?: string
  // When set, renders a back-link below the article body for the section
  // (e.g. "← Back to Shipping" pointing at /us/store).
  backHref?: string
  backLabel?: string
}

export default function InfoPageTemplate({
  page,
  section,
  backHref,
  backLabel,
}: Props) {
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
        <header className="mb-10 pb-6 border-b border-Charcoal/10">
          {section && (
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.2em] text-Gold mb-3">
              {section}
            </p>
          )}
          <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
            {page.Title}
          </h1>
          {updated && (
            <p className="mt-3 text-p-sm text-Charcoal/50">
              Last updated: {updated}
            </p>
          )}
        </header>

        <div className="prose prose-Charcoal max-w-none font-maison-neue text-Charcoal/90 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-h3-mobile md:[&_h2]:text-h3 [&_h3]:font-gyst [&_h3]:text-Charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-Gold [&_a:hover]:text-Gold/80 [&_strong]:text-Charcoal [&_blockquote]:border-l-4 [&_blockquote]:border-Gold/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-Charcoal/70 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1">
          <BlocksRenderer content={page.Content} />
        </div>

        {backHref && (
          <div className="mt-12 pt-6 border-t border-Charcoal/10">
            <LocalizedClientLink
              href={backHref}
              className="inline-flex items-center gap-2 text-Gold hover:text-Gold/80 font-maison-neue font-semibold"
            >
              ← {backLabel || "Back"}
            </LocalizedClientLink>
          </div>
        )}
      </article>
    </div>
  )
}

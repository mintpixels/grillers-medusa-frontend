import { gql } from "graphql-request"
import strapiClient from "@lib/strapi"

export type LegalPageData = {
  Slug: string
  Title: string
  Content: any[] // BlocksRenderer content
  UpdatedAt?: string
  SEO?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
  }
}

export type LegalPagesQueryResult = {
  legalPages?: LegalPageData[]
}

// Strapi `legal-page` collection-type. The route is /us/legal/[slug] and
// each entry's Slug field must match. Until that schema is added in Strapi
// admin, getLegalPage falls back to the Latin placeholder content below.
export const GetLegalPageQuery = gql`
  query LegalPage($slug: String!) {
    legalPages(filters: { Slug: { eq: $slug } }) {
      Slug
      Title
      Content
      UpdatedAt: updatedAt
      SEO {
        metaTitle
        metaDescription
        canonicalUrl
      }
    }
  }
`

export const LEGAL_SLUGS = [
  "privacy-policy",
  "terms-of-sale",
  "terms-of-use",
] as const

export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug)
}

const PLACEHOLDER_TITLES: Record<LegalSlug, string> = {
  "privacy-policy": "Privacy Policy",
  "terms-of-sale": "Terms of Sale",
  "terms-of-use": "Terms of Use",
}

// BlocksRenderer-shaped placeholder content (Lorem ipsum). Lives in code
// until the Strapi `legal-page` collection-type is created and lawyer-
// reviewed copy is loaded in. The page route uses this exact shape so
// when Strapi entries land, no template changes are needed.
const LATIN_HEADING = (text: string) => ({
  type: "heading",
  level: 2,
  children: [{ type: "text", text }],
})

const LATIN_PARAGRAPH = (text: string) => ({
  type: "paragraph",
  children: [{ type: "text", text }],
})

const LOREM_LONG =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."

const LOREM_MED =
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."

const LOREM_SHORT =
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."

const PLACEHOLDER_CONTENT: Record<LegalSlug, any[]> = {
  "privacy-policy": [
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Information We Collect"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_PARAGRAPH(LOREM_MED),
    LATIN_HEADING("How We Use Your Information"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Third-Party Services"),
    LATIN_PARAGRAPH(LOREM_MED),
    LATIN_PARAGRAPH(LOREM_SHORT),
    LATIN_HEADING("Cookies"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Your Rights"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Contact Us"),
    LATIN_PARAGRAPH(LOREM_SHORT),
  ],
  "terms-of-sale": [
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Catch-Weight Pricing"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Substitutions"),
    LATIN_PARAGRAPH(LOREM_MED),
    LATIN_HEADING("Cold-Chain & Delivery"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Returns & Refunds"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Shipping"),
    LATIN_PARAGRAPH(LOREM_MED),
    LATIN_HEADING("Kashruth"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Pricing Errors"),
    LATIN_PARAGRAPH(LOREM_SHORT),
    LATIN_HEADING("Governing Law"),
    LATIN_PARAGRAPH(LOREM_SHORT),
  ],
  "terms-of-use": [
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Account Creation"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Acceptable Use"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Intellectual Property"),
    LATIN_PARAGRAPH(LOREM_MED),
    LATIN_HEADING("Limitations of Liability"),
    LATIN_PARAGRAPH(LOREM_LONG),
    LATIN_HEADING("Dispute Resolution"),
    LATIN_PARAGRAPH(LOREM_MED),
    LATIN_HEADING("Changes to These Terms"),
    LATIN_PARAGRAPH(LOREM_SHORT),
  ],
}

export async function getLegalPage(slug: string): Promise<LegalPageData | null> {
  if (!isLegalSlug(slug)) return null
  try {
    const data = await strapiClient.request<LegalPagesQueryResult>(
      GetLegalPageQuery,
      { slug }
    )
    const page = data?.legalPages?.[0]
    if (page?.Title && page?.Content?.length) return page
  } catch {
    // Strapi `legal-page` collection-type not created yet — fall through
    // to the placeholder content below.
  }
  return {
    Slug: slug,
    Title: PLACEHOLDER_TITLES[slug],
    Content: PLACEHOLDER_CONTENT[slug],
  }
}

// Generic static-page fetcher — uses the same `legal-page` collection-type
// but without the LEGAL_SLUGS restriction. Used by the footer info pages
// (#11/#18 — Ship to Me, About, Mission, Careers, etc.) so the entire footer
// content lives in one Strapi collection editors can manage in admin.
export async function getInfoPage(slug: string): Promise<LegalPageData | null> {
  if (!slug) return null
  try {
    const data = await strapiClient.request<LegalPagesQueryResult>(
      GetLegalPageQuery,
      { slug }
    )
    const page = data?.legalPages?.[0]
    if (page?.Title && page?.Content?.length) return page
  } catch {
    // Network or schema error — return null so the route 404s cleanly.
  }
  return null
}

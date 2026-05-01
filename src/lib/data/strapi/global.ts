import { gql } from "graphql-request"

export type OrganizationData = {
  StreetAddress?: string
  City?: string
  State?: string
  PostalCode?: string
  Country?: string
  Phone?: string
  Email?: string
  SocialProfiles?: any // JSON scalar field from Strapi
}

export type GlobalData = {
  global: {
    siteName?: string
    siteDescription?: string
    OrganizationLogo?: { url: string }
    Organization?: OrganizationData
  }
}

export const GetGlobalQuery = gql`
  query GlobalQuery {
    global {
      siteName
      siteDescription
      OrganizationLogo {
        url
      }
      Organization {
        StreetAddress
        City
        State
        PostalCode
        Country
        Phone
        Email
        SocialProfiles
      }
    }
  }
`

// Defaults for Organization JSON-LD so the schema is always emitted even
// when Strapi Global → Organization isn't populated. Any field set in
// Strapi overrides these. See #66.
const DEFAULT_ORG = {
  StreetAddress: "3939 McElroy Road",
  City: "Doraville",
  State: "GA",
  PostalCode: "30340",
  Country: "US",
  Phone: "+1-770-454-8108",
  Email: "peter@grillerspride.com",
}

/**
 * Generates Organization JSON-LD schema from Strapi Global data, with
 * sensible defaults so the homepage always emits a valid Organization
 * entity for Google's Knowledge Panel even if Strapi data isn't filled in.
 */
export function generateOrganizationJsonLd(
  global: GlobalData["global"] | undefined,
  baseUrl: string
) {
  const org = { ...DEFAULT_ORG, ...(global?.Organization || {}) }

  const address = org.StreetAddress
    ? {
        "@type": "PostalAddress",
        streetAddress: org.StreetAddress,
        addressLocality: org.City,
        addressRegion: org.State,
        postalCode: org.PostalCode,
        addressCountry: org.Country || "US",
      }
    : undefined

  let sameAs: string[] | undefined
  const profiles = (org as any).SocialProfiles
  if (profiles) {
    try {
      const list = Array.isArray(profiles) ? profiles : []
      sameAs = list
        .map((profile: any) => profile?.Url)
        .filter((url: any): url is string => typeof url === "string" && url.length > 0)
    } catch (error) {
      console.warn("Failed to parse SocialProfiles from Strapi Global data:", error)
      sameAs = undefined
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    // Strapi's default placeholder is "Strapi Blog" — guard against it so
    // the JSON-LD doesn't ship that name into Google's Knowledge Graph if
    // the Global → siteName field hasn't been set yet.
    name:
      global?.siteName && global.siteName !== "Strapi Blog"
        ? global.siteName
        : "Griller's Pride",
    description: global?.siteDescription,
    url: baseUrl,
    logo: global?.OrganizationLogo?.url,
    ...(address && { address }),
    ...(org.Phone && {
      telephone: org.Phone,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: org.Phone,
        contactType: "customer service",
        ...(org.Email && { email: org.Email }),
      },
    }),
    ...(org.Email && { email: org.Email }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  }
}

/**
 * Generates WebSite JSON-LD with SearchAction for the Google sitelinks searchbox.
 */
export function generateWebSiteJsonLd(baseUrl: string, countryCode: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Grillers Pride",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/${countryCode}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

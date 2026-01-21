import { gql } from "graphql-request"

export type OrganizationData = {
  StreetAddress?: string
  City?: string
  State?: string
  PostalCode?: string
  Country?: string
  Phone?: string
  Email?: string
  SocialProfiles?: { Platform: string; Url: string }[]
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
        SocialProfiles {
          Platform
          Url
        }
      }
    }
  }
`

/**
 * Generates Organization JSON-LD schema from Strapi Global data
 */
export function generateOrganizationJsonLd(
  global: GlobalData["global"],
  baseUrl: string
) {
  const org = global?.Organization
  if (!org) return null

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

  const sameAs = org.SocialProfiles?.map((profile) => profile.Url).filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: global.siteName || "Grillers Pride",
    description: global.siteDescription,
    url: baseUrl,
    logo: global.OrganizationLogo?.url,
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

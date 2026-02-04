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

  // Safely parse SocialProfiles JSON data
  let sameAs: string[] | undefined
  if (org.SocialProfiles) {
    try {
      // SocialProfiles is a JSON field that should contain an array of {Platform, Url} objects
      const profiles = Array.isArray(org.SocialProfiles) 
        ? org.SocialProfiles 
        : []
      sameAs = profiles
        .map((profile: any) => profile?.Url)
        .filter((url: any): url is string => typeof url === 'string' && url.length > 0)
    } catch (error) {
      console.warn('Failed to parse SocialProfiles from Strapi Global data:', error)
      sameAs = undefined
    }
  }

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

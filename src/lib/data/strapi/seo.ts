import { gql } from "graphql-request"

// TypeScript types for SEO data
export type StrapiSEO = {
  metaTitle: string
  metaDescription: string
  keywords?: string
  canonicalUrl?: string
  metaRobots?: string
  structuredData?: string
  metaViewport?: string
}

export type StrapiSocialMeta = {
  ogTitle?: string
  ogDescription?: string
  ogImage?: {
    url: string
  }
  ogImageAlt?: string
  ogType?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: {
    url: string
  }
  twitterImageAlt?: string
  twitterCreator?: string
  twitterSite?: string
}

// GraphQL fragments for reuse across queries
export const SEOFieldsFragment = gql`
  fragment SEOFields on ComponentSharedSeo {
    metaTitle
    metaDescription
    keywords
    canonicalUrl
    metaRobots
  }
`

export const SocialMetaFieldsFragment = gql`
  fragment SocialMetaFields on ComponentSharedSocialMeta {
    ogTitle
    ogDescription
    ogImage {
      url
    }
    ogImageAlt
    ogType
    twitterCard
    twitterTitle
    twitterDescription
    twitterImage {
      url
    }
    twitterImageAlt
    twitterCreator
    twitterSite
  }
`


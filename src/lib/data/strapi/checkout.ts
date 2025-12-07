import { gql } from "graphql-request"
import type { StrapiSEO } from "./seo"

export type CheckoutShippingBlackoutData = {
  checkout: {
    ShippingBlackoutDaysOfWeek: string[]
    ShippingBlackoutDates: { BlackoutDate: string }[]
    DeliveryLeadTime?: number
    UPSSameDayCutoffTime?: string
    LocalPickupSameDayText?: string
    SEO?: StrapiSEO
  }
}

export const CheckoutShippingBlackoutQuery = gql`
  query CheckoutShippingBlackout {
    checkout {
      ShippingBlackoutDaysOfWeek
      ShippingBlackoutDates {
        BlackoutDate
      }
      DeliveryLeadTime
      UPSSameDayCutoffTime
      LocalPickupSameDayText
    }
  }
`

export type CheckoutPageData = {
  checkout: {
    SEO?: StrapiSEO
  }
}

export const GetCheckoutSEOQuery = gql`
  query CheckoutSEO {
    checkout {
      SEO {
        metaTitle
        metaDescription
        keywords
        canonicalUrl
      }
    }
  }
`

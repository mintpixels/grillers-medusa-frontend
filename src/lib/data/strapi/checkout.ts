import { gql } from "graphql-request"
import type { StrapiSEO } from "./seo"

// ============================================
// Fulfillment Configuration Types
// ============================================

export type SoutheastPickupLocation = {
  id: string
  Name: string
  Address: string
  City: string
  State: string
  ZipCode: string
  AvailableDates: { Date: string }[]
  CutoffDays: number // Days before pickup to stop accepting orders
}

export type AtlantaDeliveryTimeWindow = {
  id: string
  Label: string // e.g., "Evening (6pm - 9pm)"
  StartTime: string // e.g., "18:00"
  EndTime: string // e.g., "21:00"
}

export type MinimumOrderThresholds = {
  PlantPickup: number
  AtlantaDelivery: number
  AtlantaDeliveryFree: number // Order total for free delivery
  UPSShipping: number
  SoutheastPickup: number
}

export type FulfillmentConfigData = {
  checkout: {
    // Zip codes that qualify for Atlanta delivery
    AtlantaDeliveryZipCodes: string[]
    // Zip code prefixes for Southeast region (e.g., "30", "31" for Georgia)
    SoutheastZipPrefixes: string[]
    // Pickup locations for Southeast
    SoutheastPickupLocations: SoutheastPickupLocation[]
    // Time windows for Atlanta delivery
    AtlantaDeliveryTimeWindows: AtlantaDeliveryTimeWindow[]
    // Minimum order thresholds
    MinimumOrderThresholds: MinimumOrderThresholds
    // Plant pickup info
    PlantPickupAddress: string
    PlantPickupCity: string
    PlantPickupState: string
    PlantPickupZip: string
    PlantPickupHours: string
    // Atlanta delivery fee
    AtlantaDeliveryFee: number
    // Plant pickup scheduling (Strapi-driven)
    PlantPickupAvailableDays: string[]
    PlantPickupAdditionalDates: { Date: string }[]
    PlantPickupBlackoutDates: { Date: string }[]
    PlantPickupPostOrderNote: string
    PlantPickupCutoffHours: number
  }
}

export type ShippingSettingData = {
  shippingSetting: {
    PlantPickupDiscountThreshold: number | null
    PlantPickUpDiscount: number | null
  } | null
}

export type PickupCreditConfig = {
  threshold: number
  creditAmount: number
  promoCode: string
}

/**
 * Fetches checkout-level config from the Checkout singleton.
 * Only includes fields that actually exist on the Checkout content type.
 * Southeast Pickup Locations are fetched separately via SoutheastPickupLocationsQuery.
 */
export const FulfillmentConfigQuery = gql`
  query FulfillmentConfig {
    checkout {
      PlantPickupAvailableDays
      PlantPickupAdditionalDates {
        Date
      }
      PlantPickupBlackoutDates {
        Date
      }
      PlantPickupPostOrderNote
      PlantPickupCutoffHours
    }
  }
`

export type SoutheastPickupLocationsData = {
  southeastPickupLocations: {
    documentId: string
    City: string
    State: string
    Address: string | null
    ZipCode: string | null
    IsActive: boolean
    AvailableDates: { Date: string }[]
    CutoffDays: number
    Description: string | null
  }[]
}

export const SoutheastPickupLocationsQuery = gql`
  query SoutheastPickupLocations {
    southeastPickupLocations(
      filters: { IsActive: { eq: true } }
      pagination: { pageSize: 100 }
    ) {
      documentId
      City
      State
      Address
      ZipCode
      IsActive
      AvailableDates {
        Date
      }
      CutoffDays
      Description
    }
  }
`

export const ShippingSettingQuery = gql`
  query ShippingSetting {
    shippingSetting {
      PlantPickupDiscountThreshold
      PlantPickUpDiscount
    }
  }
`

// ============================================
// Existing Checkout Types
// ============================================

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

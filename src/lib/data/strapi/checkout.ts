import { gql } from "graphql-request"
import type { StrapiSEO } from "./seo"
import type { AtlantaZipDayConfig } from "@lib/util/eligible-arrival-dates"

// ============================================
// Atlanta Delivery zip → weekday + cutoff
// ============================================
//
// TODO: move to Strapi when the schema lands. For now this is a hardcoded TS map
// so the calendar eligibility logic (#36, #72) can ship without a Strapi migration.
//
// Weekdays: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat.
// cutoffHour is 24-hour EST on the day BEFORE delivery (default = 12 = noon).
// If the cutoff isn't met, the *next* occurrence of that weekday is offered instead.
//
// Source: Atlanta zip-rate policy + footer-pages-copy-2026-04-27.md.
// If a zip isn't listed here, the calendar falls back to Tue/Wed/Thu @ noon-prior cutoff.
//
export const ATLANTA_DELIVERY_ZIP_DAYS: Record<string, AtlantaZipDayConfig> = {
  // Sandy Springs / Dunwoody / North Atlanta — Tuesday route
  "30328": { weekdays: [2], cutoffHour: 12 },
  "30338": { weekdays: [2], cutoffHour: 12 },
  "30342": { weekdays: [2], cutoffHour: 12 },
  "30350": { weekdays: [2], cutoffHour: 12 },
  "30319": { weekdays: [2], cutoffHour: 12 },
  "30327": { weekdays: [2], cutoffHour: 12 },
  // Toco Hills / Decatur / Druid Hills — Wednesday route
  "30329": { weekdays: [3], cutoffHour: 12 },
  "30033": { weekdays: [3], cutoffHour: 12 },
  "30030": { weekdays: [3], cutoffHour: 12 },
  "30306": { weekdays: [3], cutoffHour: 12 },
  "30307": { weekdays: [3], cutoffHour: 12 },
  "30324": { weekdays: [3], cutoffHour: 12 },
  // Buckhead / Brookhaven — Wednesday route
  "30305": { weekdays: [3], cutoffHour: 12 },
  "30326": { weekdays: [3], cutoffHour: 12 },
  // Marietta / East Cobb — Thursday route
  "30062": { weekdays: [4], cutoffHour: 12 },
  "30068": { weekdays: [4], cutoffHour: 12 },
  "30067": { weekdays: [4], cutoffHour: 12 },
}

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

"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { 
  SERVICE_CODE_TO_FULFILLMENT, 
  FULFILLMENT_TO_SERVICE_CODES,
  FULFILLMENT_DISPLAY_ORDER 
} from "@lib/config/shipping-mapping"
import type { FulfillmentType } from "./cart"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
          fields:
            "+service_zone.fulfillment_set.type,*service_zone.fulfillment_set.location.address",
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

// Fetch ALL fulfillment options including pickup
export const listAllFulfillmentOptions = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  // Fetch without cache to ensure we get fresh data
  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
          // Request all fields to see fulfillment set type and shipping profile
          fields: "*service_zone.fulfillment_set.*,*service_zone.fulfillment_set.location.*,*shipping_profile.*",
        },
        headers,
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch((err) => {
      console.error("Error fetching fulfillment options:", err)
      return null
    })
}

/**
 * Get available fulfillment types based on what shipping options are configured in Medusa.
 * This fetches shipping options and maps them to frontend fulfillment types using the service code.
 */
export const getAvailableFulfillmentTypes = async (cartId: string): Promise<FulfillmentType[]> => {
  const options = await listAllFulfillmentOptions(cartId)
  
  if (!options || options.length === 0) {
    return []
  }

  const availableTypes = new Set<FulfillmentType>()

  options.forEach((opt) => {
    const serviceCode = (opt as any).data?.service_code 
      || (opt as any).service_code
      || extractServiceCodeFromName(opt.name)
    
    if (serviceCode && SERVICE_CODE_TO_FULFILLMENT[serviceCode]) {
      availableTypes.add(SERVICE_CODE_TO_FULFILLMENT[serviceCode])
    }
  })

  return FULFILLMENT_DISPLAY_ORDER.filter(type => availableTypes.has(type))
}

/**
 * Extract service code from option name as fallback.
 * Maps known option names to their service codes.
 */
function extractServiceCodeFromName(name: string | undefined): string | null {
  if (!name) return null
  const lowerName = name.toLowerCase()
  
  if (lowerName.includes("plant") || lowerName.includes("pickup from plant")) {
    return "PICKUP"
  }
  if (lowerName.includes("atlanta") && lowerName.includes("delivery")) {
    return "ATLANTA_DELIVERY"
  }
  if (lowerName.includes("scheduled") || lowerName.includes("southeast")) {
    return "SCHEDULED_DELIVERY"
  }
  if (lowerName.includes("ground")) {
    return "GROUND"
  }
  if (lowerName.includes("overnight")) {
    return "OVERNIGHT"
  }
  
  return null
}

/**
 * Find a shipping option in Medusa that matches the given fulfillment type.
 * Uses the service code mapping for reliable matching.
 */
export const findShippingOptionByType = async (
  cartId: string, 
  fulfillmentType: FulfillmentType
): Promise<HttpTypes.StoreShippingOption | null> => {
  const options = await listAllFulfillmentOptions(cartId)
  
  if (!options || options.length === 0) {
    return null
  }

  const validServiceCodes = FULFILLMENT_TO_SERVICE_CODES[fulfillmentType]

  // First try to match by service_code in option data
  let matchedOption = options.find((opt) => {
    const serviceCode = (opt as any).data?.service_code || (opt as any).service_code
    return serviceCode && validServiceCodes.includes(serviceCode)
  })

  // Fallback: try to extract service code from name
  if (!matchedOption) {
    matchedOption = options.find((opt) => {
      const serviceCode = extractServiceCodeFromName(opt.name)
      return serviceCode && validServiceCodes.includes(serviceCode)
    })
  }

  return matchedOption || null
}

// Find a pickup option by name match (legacy - use findShippingOptionByType instead)
export const findPickupOption = async (cartId: string, pickupType: "plant_pickup" | "southeast_pickup") => {
  const options = await listAllFulfillmentOptions(cartId)
  
  if (!options || options.length === 0) {
    return null
  }

  // Map our fulfillment type to expected option names
  // Note: Medusa backend uses "Pickup From Plant..." and "Scheduled Delivery"
  const searchTerms = pickupType === "plant_pickup" 
    ? ["plant pickup", "plant", "atlanta pickup", "pickup"]
    : ["southeast pickup", "southeast", "co-op", "scheduled", "delivery"]

  // First try to find by fulfillment set type = pickup
  let pickupOption = options.find(opt => 
    opt.service_zone?.fulfillment_set?.type === "pickup" &&
    searchTerms.some(term => opt.name?.toLowerCase().includes(term))
  )

  // If not found, try just by name
  if (!pickupOption) {
    pickupOption = options.find(opt =>
      searchTerms.some(term => opt.name?.toLowerCase().includes(term))
    )
  }

  // Last resort: any pickup type option
  if (!pickupOption) {
    pickupOption = options.find(opt => 
      opt.service_zone?.fulfillment_set?.type === "pickup"
    )
  }

  return pickupOption
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((e) => {
      return null
    })
}

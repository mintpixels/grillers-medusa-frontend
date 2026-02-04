"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"

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
    .then(({ shipping_options }) => {
      console.log("=== ALL SHIPPING OPTIONS FOR CART ===")
      console.log("Cart ID:", cartId)
      console.log("Total options found:", shipping_options?.length || 0)
      shipping_options?.forEach((o, i) => {
        console.log(`Option ${i + 1}:`, {
          id: o.id,
          name: o.name,
          type: (o as any).service_zone?.fulfillment_set?.type,
          shipping_profile_id: (o as any).shipping_profile_id,
          shipping_profile: (o as any).shipping_profile,
        })
      })
      console.log("=====================================")
      return shipping_options
    })
    .catch((err) => {
      console.error("Error fetching fulfillment options:", err)
      return null
    })
}

// Find a pickup option by name match
export const findPickupOption = async (cartId: string, pickupType: "plant_pickup" | "southeast_pickup") => {
  const options = await listAllFulfillmentOptions(cartId)
  
  if (!options || options.length === 0) {
    console.log("No fulfillment options found for cart:", cartId)
    return null
  }

  // Map our fulfillment type to expected option names
  const searchTerms = pickupType === "plant_pickup" 
    ? ["plant pickup", "plant", "atlanta pickup"]
    : ["southeast pickup", "southeast", "co-op"]

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

  console.log("Found pickup option:", pickupOption?.id, pickupOption?.name)
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

"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export type SavedPaymentMethod = {
  id: string
  provider_id: string
  data: {
    card?: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  }
}

/**
 * Fetch saved payment methods for the current customer.
 * Requires the backend to have a custom API route at /store/payment-methods/:account_holder_id
 */
export async function getSavedPaymentMethods(): Promise<SavedPaymentMethod[]> {
  try {
    const headers = await getAuthHeaders()
    if (!headers) return []

    const { customer } = await sdk.client.fetch<{
      customer: { metadata?: { stripe_account_holder_id?: string } }
    }>("/store/customers/me", { method: "GET", headers })

    const accountHolderId = customer?.metadata?.stripe_account_holder_id
    if (!accountHolderId) return []

    const { payment_methods } = await sdk.client.fetch<{
      payment_methods: SavedPaymentMethod[]
    }>(`/store/payment-methods/${accountHolderId}`, {
      method: "GET",
      headers,
    })

    return payment_methods || []
  } catch (error) {
    console.error("Error fetching saved payment methods:", error)
    return []
  }
}

/**
 * Delete a saved payment method.
 */
export async function deleteSavedPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean }> {
  try {
    const headers = await getAuthHeaders()
    if (!headers) return { success: false }

    await sdk.client.fetch(`/store/payment-methods/${paymentMethodId}`, {
      method: "DELETE",
      headers,
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return { success: false }
  }
}

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
  }

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1
      })
    )
    .catch(() => {
      return null
    })
}

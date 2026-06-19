"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getActiveStaffImpersonation } from "./customer"
import { HttpTypes } from "@medusajs/types"
import { reportServerSoftFailure } from "@lib/server-soft-failure"

export type SavedPaymentMethod = {
  id: string
  provider_id: string
  is_default?: boolean
  data: {
    card?: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  }
}

export async function getPaymentContextHeaders() {
  const headers = { ...(await getAuthHeaders()) } as Record<string, string>
  const active = await getActiveStaffImpersonation().catch(() => null)

  if (active) {
    headers["x-gp-staff-target-customer-id"] = active.session.targetCustomerId
    headers["x-gp-staff-actor-customer-id"] = active.session.staffCustomerId
  }

  return headers
}

export async function getSavedPaymentMethods(): Promise<SavedPaymentMethod[]> {
  try {
    const headers = await getPaymentContextHeaders()
    if (!headers.authorization) return []

    const { payment_methods } = await sdk.client.fetch<{
      payment_methods: SavedPaymentMethod[]
    }>("/store/payment-methods", {
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
 * Request a Stripe SetupIntent client_secret so the storefront can collect a
 * card via Elements and attach it to the customer's stripe account holder.
 * Backend route required: POST /store/payment-methods/setup-intent
 *   body: {} → { client_secret: string, account_holder_id: string }
 */
export async function createPaymentMethodSetupIntent(): Promise<
  | {
      client_secret: string
      account_holder_id: string
    }
  | { error: string }
> {
  try {
    const headers = await getPaymentContextHeaders()
    if (!headers.authorization) {
      return { error: "You must be signed in to add a card." }
    }

    const result = await sdk.client.fetch<{
      client_secret: string
      account_holder_id: string
    }>("/store/payment-methods/setup-intent", {
      method: "POST",
      headers,
      body: {},
    })

    if (!result?.client_secret) {
      return { error: "Could not start a card setup. Please try again." }
    }
    return result
  } catch (error: any) {
    console.error("Error creating SetupIntent:", error)
    return {
      error:
        error?.data?.message ||
        error?.message ||
        "Could not start a card setup. Please try again.",
    }
  }
}

/**
 * Mark a saved payment method as the customer's default.
 * Backend route required: POST /store/payment-methods/:id/default
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getPaymentContextHeaders()
    if (!headers.authorization)
      return { success: false, error: "Not signed in" }

    await sdk.client.fetch(
      `/store/payment-methods/${paymentMethodId}/default`,
      {
        method: "POST",
        headers,
        body: {},
      }
    )
    return { success: true }
  } catch (error: any) {
    console.error("Error setting default payment method:", error)
    return {
      success: false,
      error: error?.data?.message || error?.message || "Could not set default.",
    }
  }
}

/**
 * Delete a saved payment method.
 */
export async function deleteSavedPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean }> {
  try {
    const headers = await getPaymentContextHeaders()
    if (!headers.authorization) return { success: false }

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
    .catch((e) => {
      // Checkout path: no payment providers → checkout cannot proceed.
      reportServerSoftFailure(
        "src/lib/data/payment.ts:listCartPaymentMethods",
        e,
        { region_id: regionId }
      )
      return null
    })
}

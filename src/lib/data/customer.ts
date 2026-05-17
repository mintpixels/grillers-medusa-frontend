"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { isSameAddressKey } from "@lib/util/compare-addresses"
import { isValidUSPhone, stripPhone } from "@lib/util/format-phone"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  setCartId,
} from "./cookies"

/**
 * Issue #74 — When an account is created during checkout, the cart's
 * shipping address never lands in the customer's address book. After the
 * customer is created and authenticated, copy the cart's shipping (and
 * distinct billing) address into the address book so the customer's first
 * order populates "saved addresses".
 *
 * Idempotent: skips addresses that already match (address_1 + postal_code +
 * country_code, normalized). Marks the first inserted address as default
 * shipping/billing only when the address book is currently empty.
 */
async function saveCartAddressesToAccount(): Promise<void> {
  try {
    const cartId = await getCartId()
    if (!cartId) return

    const headers = { ...(await getAuthHeaders()) }
    if (!("authorization" in headers) || !(headers as any).authorization) return

    // Pull the cart fresh — the auth context just changed, so go direct
    // (no-cache) rather than reusing a possibly-stale cached response.
    const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${cartId}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    const shipping = cart?.shipping_address
    if (!shipping?.address_1) return

    const { customer } = await sdk.store.customer.retrieve({}, headers)
    const existing: any[] = customer?.addresses || []
    const isFirstAddress = existing.length === 0

    if (!existing.some((a) => isSameAddressKey(a, shipping))) {
      await sdk.store.customer.createAddress(
        {
          first_name: shipping.first_name || "",
          last_name: shipping.last_name || "",
          address_1: shipping.address_1 || "",
          address_2: shipping.address_2 || "",
          company: shipping.company || "",
          city: shipping.city || "",
          postal_code: shipping.postal_code || "",
          province: shipping.province || "",
          country_code: shipping.country_code || "",
          // Persist digits-only — the cart may carry already-formatted
          // legacy data; normalize at the boundary (#68).
          phone: shipping.phone ? stripPhone(shipping.phone) : "",
          is_default_shipping: isFirstAddress,
          is_default_billing: isFirstAddress,
        },
        {},
        headers
      )
    }

    const billing = cart?.billing_address
    if (
      billing?.address_1 &&
      !isSameAddressKey(billing, shipping) &&
      !existing.some((a) => isSameAddressKey(a, billing))
    ) {
      await sdk.store.customer.createAddress(
        {
          first_name: billing.first_name || "",
          last_name: billing.last_name || "",
          address_1: billing.address_1 || "",
          address_2: billing.address_2 || "",
          company: billing.company || "",
          city: billing.city || "",
          postal_code: billing.postal_code || "",
          province: billing.province || "",
          country_code: billing.country_code || "",
          phone: billing.phone ? stripPhone(billing.phone) : "",
        },
        {},
        headers
      )
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
  } catch {
    // Non-critical — never block account creation or order completion if
    // saving the address to the book fails.
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const backendUrl =
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const publishableKey =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    await fetch(`${backendUrl}/store/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify({ email }),
    })
  } catch {
    // Intentionally swallow — caller shows the same success state regardless,
    // to avoid leaking whether an account exists for this email or whether
    // the backend is reachable.
  }
}

export async function completePasswordReset(
  token: string,
  email: string,
  password: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )
    return { success: true, error: null }
  } catch {
    return {
      success: false,
      error:
        "This reset link is invalid or has expired. Please request a new one.",
    }
  }
}

function normalizeLoginIdentifier(value: string) {
  const trimmed = String(value ?? "").trim()
  return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed
}

export async function loginWithCredentials(email: string, password: string) {
  const loginId = normalizeLoginIdentifier(email)

  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email: loginId,
      password,
    })
    await setAuthToken(token as string)
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    await transferCart()
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: "Invalid login or password" }
  }
}

export async function signupWithCredentials(data: {
  email: string
  password: string
  first_name: string
  last_name: string
}) {
  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: data.email,
      password: data.password,
    })
    await setAuthToken(token as string)

    const headers = { ...(await getAuthHeaders()) }
    await sdk.store.customer.create(
      { email: data.email, first_name: data.first_name, last_name: data.last_name },
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: data.email,
      password: data.password,
    })
    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    await transferCart()

    // Issue #74 — Path A: copy the in-flight cart's shipping address to the
    // newly-created customer's address book so first-order checkout
    // populates "saved addresses".
    await saveCartAddressesToAccount()

    return { success: true, error: null }
  } catch (error: any) {
    const msg = error?.message || error?.toString() || ""
    if (msg.includes("exists") || msg.includes("already")) {
      return { success: false, error: "An account with this email already exists. Try signing in instead." }
    }
    return { success: false, error: "Could not create account. Please try again." }
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    await sdk.auth.login("customer", "emailpass", {
      email,
      password: "__check_only__" + Math.random(),
    })
    return true
  } catch (error: any) {
    const msg = error?.message || error?.toString() || ""
    if (msg.includes("Invalid email or password") || msg.includes("Unauthorized")) {
      return true
    }
    return false
  }
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          // Expand BOTH orders and addresses. Without `*addresses` Medusa
          // omits the customer's saved addresses, which the checkout flow
          // (and the "Add Address" CTA) depend on to detect whether a
          // logged-in customer already has a delivery address on file.
          fields: "*orders,*addresses",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const rawPhone = (formData.get("phone") as string) || ""
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    // Normalize phone to digits-only so the display layer is the single
    // source of formatting (#68). Empty string is preserved when no phone
    // was provided.
    phone: rawPhone ? stripPhone(rawPhone) : "",
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart()

    // Issue #74 — Path A: copy the in-flight cart's shipping address to the
    // newly-created customer's address book so first-order checkout
    // populates "saved addresses".
    await saveCartAddressesToAccount()

    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const loginId = normalizeLoginIdentifier(formData.get("email") as string)
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email: loginId, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string, redirectTo?: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(redirectTo || `/${countryCode}/account`)
}

/**
 * Sign out without removing the cart or redirecting.
 * Used during checkout so the customer can re-authenticate
 * without losing their in-progress cart.
 */
export async function signoutKeepCart() {
  await sdk.auth.logout()
  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()
  const cartsCacheTag = await getCacheTag("carts")

  try {
    await sdk.store.cart.transferCart(cartId, {}, headers)
    revalidateTag(cartsCacheTag)
    return
  } catch (transferErr) {
    console.error(
      "[transferCart] failed; recovering with a fresh, customer-attached cart",
      transferErr
    )
  }

  // The guest cart can't be attached to this customer — usually because the
  // backend cart record is in a state Medusa can't update (e.g. a stuck
  // payment_collection from an earlier failed checkout). Capture the line
  // items, drop the broken cookie, then create a fresh cart for the customer
  // and re-add the items. End state: customer always has a cart whose
  // customer_id matches them. No mismatch banner needed.
  let preservedItems: Array<{ variant_id: string; quantity: number }> = []
  let regionId: string | undefined
  try {
    const { cart: brokenCart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${cartId}`,
      { method: "GET", headers }
    )
    regionId = brokenCart?.region_id ?? undefined
    preservedItems = (brokenCart?.items ?? [])
      .filter((i) => !!i.variant_id)
      .map((i) => ({ variant_id: i.variant_id as string, quantity: i.quantity }))
  } catch {
    // best-effort; if the broken cart can't be read, just drop it and continue
  }

  await removeCartId()

  if (regionId) {
    try {
      const { cart: fresh } = await sdk.store.cart.create(
        { region_id: regionId },
        {},
        headers
      )
      await setCartId(fresh.id)
      for (const item of preservedItems) {
        await sdk.store.cart.createLineItem(fresh.id, item, {}, headers)
      }
    } catch (recreateErr) {
      console.error("[transferCart] item preservation failed", recreateErr)
    }
  }

  revalidateTag(cartsCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  // Read default flags from FormData (checkboxes) first, falling back to
  // currentState for legacy callers that pre-set them. Empty checkboxes
  // don't appear in FormData, so use a presence check.
  const formDefaultBilling = formData.has("is_default_billing")
  const formDefaultShipping = formData.has("is_default_shipping")
  const isDefaultBilling =
    formDefaultBilling || (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping =
    formDefaultShipping || (currentState.isDefaultShipping as boolean) || false

  const rawPhone = (formData.get("phone") as string) || ""
  if (!isValidUSPhone(rawPhone)) {
    return {
      success: false,
      error: "Phone number must be a 10-digit US number.",
    }
  }
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: (formData.get("country_code") as string) || "us",
    // Persist digits-only so the display layer is the single source of
    // formatting (#68). Customers may paste "(404) 643-1567" or "404-643-1567";
    // we normalize at the boundary; validation above caught malformed input.
    phone: rawPhone ? stripPhone(rawPhone) : "",
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

/**
 * Save a delivery address to BOTH the customer's address book and the
 * current cart's shipping_address. Used by the checkout flow's
 * "Add your address" CTA so logged-in customers can unlock local delivery
 * and pickup options whose eligibility depends on a postal code.
 *
 * Idempotent on the customer side: if an address with the same
 * address_1 + postal_code already exists, we skip the createAddress call.
 */
export async function saveAddressToProfileAndCart(input: {
  first_name: string
  last_name: string
  address_1: string
  city: string
  province: string
  postal_code: string
  phone: string
  country_code?: string
}): Promise<{ success: boolean; error: string | null }> {
  const headers = { ...(await getAuthHeaders()) }
  const country = (input.country_code || "us").toLowerCase()
  const addressPayload = {
    first_name: input.first_name,
    last_name: input.last_name,
    address_1: input.address_1,
    city: input.city,
    province: input.province,
    postal_code: input.postal_code,
    country_code: country,
    // Single normalization point used for both address-book + cart writes
    // below — phones save as canonical digits regardless of input shape (#68).
    phone: input.phone ? stripPhone(input.phone) : "",
  }

  try {
    const me = await retrieveCustomer()
    const alreadyOnFile = (me?.addresses || []).some(
      (a) =>
        (a.address_1 || "").trim().toLowerCase() ===
          input.address_1.trim().toLowerCase() &&
        (a.postal_code || "").trim() === input.postal_code.trim()
    )
    const customerHadNoAddresses = (me?.addresses || []).length === 0

    if (!alreadyOnFile) {
      await sdk.store.customer.createAddress(
        {
          ...addressPayload,
          // First saved address becomes the default for shipping + billing.
          is_default_shipping: customerHadNoAddresses,
          is_default_billing: customerHadNoAddresses,
        },
        {},
        headers
      )
      revalidateTag(await getCacheTag("customers"))
    }

    const cartId = await getCartId()
    if (cartId) {
      await sdk.store.cart.update(
        cartId,
        {
          shipping_address: addressPayload,
          billing_address: addressPayload,
        },
        {},
        headers
      )
      revalidateTag(await getCacheTag("carts"))
      revalidateTag(await getCacheTag("fulfillment"))
    }

    return { success: true, error: null }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Could not save your address. Please try again.",
    }
  }
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: (formData.get("country_code") as string) || "us",
  } as HttpTypes.StoreUpdateCustomerAddress

  // Persist digits-only on update for the same reason as add-address (#68).
  const phone = formData.get("phone") as string
  if (!isValidUSPhone(phone)) {
    return {
      success: false,
      error: "Phone number must be a 10-digit US number.",
    }
  }
  if (phone) {
    address.phone = stripPhone(phone)
  }

  // Default-flag checkboxes (#49) — only sent when checked.
  if (formData.has("is_default_shipping")) {
    address.is_default_shipping = true
  }
  if (formData.has("is_default_billing")) {
    address.is_default_billing = true
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

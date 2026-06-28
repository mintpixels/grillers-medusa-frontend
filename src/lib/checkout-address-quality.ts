import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import {
  isHistoricallyScrambledAddress,
  unscrambleAddress,
} from "@lib/util/format-address"

type CheckoutAddressFields = {
  city?: unknown
  province?: unknown
  postal_code?: unknown
}

type AddressParts = {
  city: string
  province: string
  postal_code: string
}

type AddressRepairResult<T extends CheckoutAddressFields> = {
  address: T
  repaired: boolean
  raw: AddressParts
  normalized: AddressParts
}

function text(value: unknown): string {
  if (typeof value === "string") return value
  if (value === null || value === undefined) return ""
  return String(value)
}

export function repairCheckoutAddressForWrite<
  T extends CheckoutAddressFields,
>(address: T): AddressRepairResult<T> {
  const raw = {
    city: text(address.city),
    province: text(address.province),
    postal_code: text(address.postal_code),
  }

  if (!isHistoricallyScrambledAddress(raw)) {
    return {
      address,
      repaired: false,
      raw,
      normalized: raw,
    }
  }

  const normalized = unscrambleAddress(raw)
  return {
    address: {
      ...address,
      city: normalized.city,
      province: normalized.province,
      postal_code: normalized.postal_code,
    },
    repaired: true,
    raw,
    normalized,
  }
}

export function reportCheckoutAddressRepair(input: {
  surface: string
  path: string
  result: AddressRepairResult<CheckoutAddressFields>
  cartId?: string | null
  addressId?: string | null
  customerId?: string | null
  targetCustomerId?: string | null
  staffContext?: boolean
}) {
  if (!input.result.repaired) return

  void emitStorefrontOpsAlert({
    alertKind: "checkout_address_scramble_repaired",
    severity: "info",
    title: "Checkout address city/state/ZIP scramble repaired before write",
    path: input.path,
    source: "medusa-server",
    meta: {
      surface: input.surface,
      cart_id: input.cartId || null,
      address_id: input.addressId || null,
      customer_id: input.customerId || null,
      target_customer_id: input.targetCustomerId || null,
      staff_context: Boolean(input.staffContext),
      raw_city: input.result.raw.city || null,
      raw_province: input.result.raw.province || null,
      raw_postal_code: input.result.raw.postal_code || null,
      normalized_city: input.result.normalized.city || null,
      normalized_province: input.result.normalized.province || null,
      normalized_postal_code: input.result.normalized.postal_code || null,
    },
  }).catch(() => {
    // Fail-open: data-quality telemetry must never block checkout.
  })
}

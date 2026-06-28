import { formatCityStateZip, unscrambleAddress } from "@lib/util/format-address"

type FulfillmentAddress = {
  id?: string | null
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}

export function normalizeFulfillmentAddress<T extends FulfillmentAddress | null | undefined>(
  address: T
): T {
  if (!address) return address
  return unscrambleAddress(address) as T
}

export function hasUsableFulfillmentAddress(
  address: FulfillmentAddress | null | undefined
) {
  const fixed = normalizeFulfillmentAddress(address)
  return Boolean(fixed?.address_1 && fixed?.postal_code)
}

export function getActiveFulfillmentAddress<
  TCart extends FulfillmentAddress,
  TCustomer extends FulfillmentAddress,
>(
  cartAddress: TCart | null | undefined,
  preferredCustomerAddress: TCustomer | null | undefined
): TCart | TCustomer | null | undefined {
  const rawAddress = hasUsableFulfillmentAddress(cartAddress)
    ? cartAddress
    : hasUsableFulfillmentAddress(preferredCustomerAddress)
      ? preferredCustomerAddress
      : cartAddress || preferredCustomerAddress

  return normalizeFulfillmentAddress(rawAddress)
}

export function formatFulfillmentAddressLine(
  address: FulfillmentAddress | null | undefined
) {
  if (!address) return ""
  const fixed = normalizeFulfillmentAddress(address)
  const cityStateZip = formatCityStateZip({
    city: fixed?.city ?? null,
    province: fixed?.province ?? null,
    postal_code: fixed?.postal_code ?? null,
  })
  return [fixed?.address_1, cityStateZip]
    .filter(Boolean)
    .join(", ")
}

export function fulfillmentAddressesMatch(
  address: FulfillmentAddress | null | undefined,
  savedAddress: FulfillmentAddress
) {
  const fixedAddress = normalizeFulfillmentAddress(address)
  const fixedSavedAddress = normalizeFulfillmentAddress(savedAddress)
  const normalize = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase()

  return (
    normalize(fixedAddress?.address_1) ===
      normalize(fixedSavedAddress.address_1) &&
    normalize(fixedAddress?.postal_code) ===
      normalize(fixedSavedAddress.postal_code) &&
    normalize(fixedAddress?.city) === normalize(fixedSavedAddress.city) &&
    normalize(fixedAddress?.province) === normalize(fixedSavedAddress.province)
  )
}

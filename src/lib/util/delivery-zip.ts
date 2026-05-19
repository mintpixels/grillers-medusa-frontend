export const DELIVERY_ZIP_STORAGE_KEY = "gp_delivery_zip"
export const DELIVERY_ZIP_COOKIE = "gp_delivery_zip"
export const DELIVERY_ZIP_EVENT = "gp:delivery-zip-updated"

export function normalizeDeliveryZip(value?: string | null): string {
  return (value || "").replace(/\D/g, "").slice(0, 5)
}

type AddressLike = {
  postal_code?: string | null
  is_default_shipping?: boolean | null
}

export function getAddressBookDeliveryZip(
  addresses?: AddressLike[] | null
): string {
  const defaultShippingZip = normalizeDeliveryZip(
    addresses?.find((address) => address.is_default_shipping)?.postal_code
  )
  if (defaultShippingZip) return defaultShippingZip

  return normalizeDeliveryZip(addresses?.[0]?.postal_code)
}

export function getStoredDeliveryZip(): string {
  if (typeof window === "undefined") return ""

  try {
    const saved = window.localStorage.getItem(DELIVERY_ZIP_STORAGE_KEY)
    const normalized = normalizeDeliveryZip(saved)
    if (normalized) return normalized
  } catch {
    // Local storage is a convenience only.
  }

  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${DELIVERY_ZIP_COOKIE}=`))
    return normalizeDeliveryZip(match?.split("=")[1])
  } catch {
    return ""
  }
}

export function storeDeliveryZip(value: string): string {
  const normalized = normalizeDeliveryZip(value)
  if (typeof window === "undefined") return normalized

  try {
    if (normalized.length === 5) {
      window.localStorage.setItem(DELIVERY_ZIP_STORAGE_KEY, normalized)
      document.cookie = [
        `${DELIVERY_ZIP_COOKIE}=${normalized}`,
        "Path=/",
        "Max-Age=15552000",
        "SameSite=Lax",
        window.location.protocol === "https:" ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ")
      window.dispatchEvent(
        new CustomEvent(DELIVERY_ZIP_EVENT, { detail: { zip: normalized } })
      )
    }
  } catch {
    // Ignore storage failures.
  }

  return normalized
}

export function clearStoredDeliveryZip() {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(DELIVERY_ZIP_STORAGE_KEY)
    document.cookie = `${DELIVERY_ZIP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
    window.dispatchEvent(
      new CustomEvent(DELIVERY_ZIP_EVENT, { detail: { zip: "" } })
    )
  } catch {
    // Ignore storage failures.
  }
}

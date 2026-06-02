export type AddressSuggestionFields = {
  address_1: string
  city: string
  province: string
  postal_code: string
  country_code: string
}

type AddressLocation = {
  city?: string | null
  province?: string | null
  postal_code?: string | null
}

export type AddressSuggestionConflict = {
  typed: string
  suggested: string
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeProvince(value: unknown): string {
  return text(value).toUpperCase()
}

function normalizePostalCode(value: unknown): string {
  return text(value).replace(/\D/g, "").slice(0, 5)
}

function formatLocation(location: AddressLocation): string {
  const parts = [
    text(location.city),
    normalizeProvince(location.province),
    normalizePostalCode(location.postal_code),
  ].filter(Boolean)

  return parts.join(", ")
}

export function getAddressSuggestionConflict(
  current: AddressLocation,
  suggestion: AddressSuggestionFields
): AddressSuggestionConflict | null {
  const currentProvince = normalizeProvince(current.province)
  const suggestedProvince = normalizeProvince(suggestion.province)
  const currentPostal = normalizePostalCode(current.postal_code)
  const suggestedPostal = normalizePostalCode(suggestion.postal_code)

  const provinceConflicts =
    currentProvince &&
    suggestedProvince &&
    currentProvince !== suggestedProvince
  const postalConflicts =
    currentPostal && suggestedPostal && currentPostal !== suggestedPostal

  if (!provinceConflicts && !postalConflicts) {
    return null
  }

  return {
    typed: formatLocation(current),
    suggested: formatLocation(suggestion),
  }
}

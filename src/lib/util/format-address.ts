import type { HttpTypes } from "@medusajs/types"

type Addr = Pick<
  HttpTypes.StoreCustomerAddress,
  "address_1" | "address_2" | "city" | "province" | "postal_code" | "country_code"
> & {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  phone?: string | null
}

const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  ca: "Canada",
  gb: "United Kingdom",
  uk: "United Kingdom",
}

export function formatCountry(code?: string | null): string {
  if (!code) return ""
  const lower = code.toLowerCase()
  return COUNTRY_NAMES[lower] || code.toUpperCase()
}

// Standard US-postal third line: "City, State Zip" — falling back gracefully
// when state is missing (legacy addresses), zip is missing, or city is missing.
export function formatCityStateZip(
  addr: Pick<Addr, "city" | "province" | "postal_code">
): string {
  const city = addr.city?.trim() || ""
  const state = addr.province?.trim() || ""
  const zip = addr.postal_code?.trim() || ""

  if (city && state && zip) return `${city}, ${state} ${zip}`
  if (city && state) return `${city}, ${state}`
  if (city && zip) return `${city} ${zip}`
  if (state && zip) return `${state} ${zip}`
  return city || state || zip
}

// Returns the address rendered as ordered lines for stacking in JSX.
// Skips empty lines so missing fields don't leave gaps.
export function formatAddressLines(addr: Addr | null | undefined): string[] {
  if (!addr) return []
  const lines: string[] = []
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim()
  if (name) lines.push(name)
  if (addr.company) lines.push(addr.company)
  if (addr.address_1) lines.push(addr.address_1)
  if (addr.address_2) lines.push(addr.address_2)
  const cityLine = formatCityStateZip(addr)
  if (cityLine) lines.push(cityLine)
  const country = formatCountry(addr.country_code)
  if (country) lines.push(country)
  return lines
}

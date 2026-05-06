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

// Detects + repairs a specific historical data corruption: an earlier
// Edit-address modal deploy bound `province` to the city input, `city` to
// the state field, and `postal_code` to the city field — saving scrambled
// the three columns. Records written during that window read back as
// e.g. city="GA" / province="30328" / postal_code="Sandy Springs", which
// passed through the (correct) display formatter as "GA, 30328 Sandy
// Springs" (#24, #76).
//
// We never mutate the underlying record automatically, but we DO unswap
// the three fields at read time so the card / form-prefill show the
// right values. When the customer next saves the address the form posts
// the unswapped values back and the DB self-heals.
function looksLikeZip(s?: string | null): boolean {
  return /^\d{5}(-\d{4})?$/.test((s || "").trim())
}

function looksLikeStateCode(s?: string | null): boolean {
  return /^[A-Za-z]{2}$/.test((s || "").trim())
}

function looksLikeCityName(s?: string | null): boolean {
  // Has letters, isn't all digits, isn't a 2-letter abbreviation.
  const v = (s || "").trim()
  if (!v) return false
  if (/^\d+$/.test(v)) return false
  if (/^[A-Za-z]{2}$/.test(v)) return false
  return /[A-Za-z]/.test(v)
}

export function unscrambleAddress<T extends Partial<Addr>>(addr: T): T {
  if (!addr) return addr
  const swapped =
    looksLikeStateCode(addr.city as string | null) &&
    looksLikeZip(addr.province as string | null) &&
    looksLikeCityName(addr.postal_code as string | null)
  if (!swapped) return addr
  return {
    ...addr,
    city: addr.postal_code,
    province: (addr.city as string).toUpperCase(),
    postal_code: addr.province,
  }
}

// Standard US-postal third line: "City, State Zip" — falling back gracefully
// when state is missing (legacy addresses), zip is missing, or city is missing.
export function formatCityStateZip(
  addr: Pick<Addr, "city" | "province" | "postal_code">
): string {
  const fixed = unscrambleAddress(addr as any)
  const city = fixed.city?.trim() || ""
  const state = fixed.province?.trim() || ""
  const zip = fixed.postal_code?.trim() || ""

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

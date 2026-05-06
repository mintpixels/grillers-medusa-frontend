import { isEqual, pick } from "lodash"

export default function compareAddresses(address1: any, address2: any) {
  return isEqual(
    pick(address1, [
      "first_name",
      "last_name",
      "address_1",
      "company",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ]),
    pick(address2, [
      "first_name",
      "last_name",
      "address_1",
      "company",
      "postal_code",
      "city",
      "country_code",
      "province",
      "phone",
    ])
  )
}

/**
 * Lightweight normalized comparator used by the "save shipping address to
 * customer address book" idempotency check (issue #74). Matches on
 * address_1 + postal_code + country_code so that minor casing/whitespace
 * differences don't create duplicate rows in the address book.
 */
export function isSameAddressKey(a: any, b: any): boolean {
  if (!a || !b) return false
  const norm = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "")
  return (
    norm(a.address_1) === norm(b.address_1) &&
    norm(a.postal_code) === norm(b.postal_code) &&
    norm(a.country_code) === norm(b.country_code)
  )
}

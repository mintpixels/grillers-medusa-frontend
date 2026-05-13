/**
 * Reduce a possibly-formatted phone to the canonical 10-digit US form.
 * Mirrors formatPhone's handling so the round-trip is stable:
 *   formatPhone(stripPhone(x)) === formatPhone(x)
 *
 * Drops a leading country-code `1` on 11-digit inputs so
 * `stripPhone("1 (404) 643-1567") === "4046431567"` instead of corrupting
 * to `1404643156` (silently losing the trailing 7).
 */
export function stripPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "")
  const digits =
    cleaned.length === 11 && cleaned.startsWith("1") ? cleaned.slice(1) : cleaned
  return digits.slice(0, 10)
}

/**
 * True when `value` is empty (treat unset as valid for optional fields)
 * OR a parseable US phone that strips down to exactly 10 digits. Use this
 * in server actions before persisting so we never write a half-digit phone.
 */
export function isValidUSPhone(value: string | null | undefined): boolean {
  if (!value) return true
  return stripPhone(value).length === 10
}

/**
 * Formats a US phone number as (XXX) XXX-XXXX.
 *
 * Always normalizes input to digits first so calling formatPhone on an
 * already-formatted value (e.g. "(404) 643-1567") does NOT double-wrap
 * into "((40) 4) -643-1567" (#68).
 *
 * Input can be raw digits, formatted, or 11-digit with leading 1 — all
 * collapse to the canonical 10-digit form.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const cleaned = phone.replace(/\D/g, "")
  // Drop leading country-code 1 from 11-digit US numbers.
  const digits =
    cleaned.length === 11 && cleaned.startsWith("1") ? cleaned.slice(1) : cleaned

  if (digits.length === 0) return ""
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

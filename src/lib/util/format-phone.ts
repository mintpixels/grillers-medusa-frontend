export function stripPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10)
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

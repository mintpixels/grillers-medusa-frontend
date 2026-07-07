import { HttpTypes } from "@medusajs/types"
import { stripPhone } from "@lib/util/format-phone"

/**
 * First-login contact verification for migrated (pre-launch) customers.
 *
 * ~4.5K customers were synced into Medusa from QuickBooks/the legacy site
 * with phones, emails, and (via order history) addresses we've never had
 * them confirm on the new stack. Before we can text anyone we need (a) the
 * customer to tell us which number on file is their primary MOBILE, and
 * (b) an explicit, versioned SMS opt-in (TCPA express written consent —
 * the same consent record used at signup/checkout: see
 * `@lib/util/sms-consent`). While they're here we confirm the primary
 * email and default shipping address.
 *
 * Eligibility: customers created BEFORE the cutoff (i.e. the migrated
 * book — post-launch signups already provide + consent to everything at
 * registration) who haven't completed or skipped the flow.
 */

export const CONTACT_VERIFICATION_VERSION = "contact-verify-v1-2026-07-07"

/** Customers created before this instant are "existing" (migrated). */
export const CONTACT_VERIFY_CUTOFF_ISO =
  process.env.CONTACT_VERIFY_CUTOFF_ISO || "2026-07-07T00:00:00Z"

export const CONTACT_VERIFIED_AT_KEY = "contact_verified_at"
export const CONTACT_VERIFIED_VERSION_KEY = "contact_verified_version"
export const CONTACT_VERIFY_SKIPPED_AT_KEY = "contact_verify_skipped_at"
export const PREFERRED_EMAIL_KEY = "preferred_contact_email"
export const EMAIL_CONFIRMED_AT_KEY = "email_confirmed_at"

type CustomerLike = Pick<
  HttpTypes.StoreCustomer,
  "created_at" | "metadata" | "phone" | "addresses" | "email"
>

export function hasCompletedContactVerification(
  customer: CustomerLike | null | undefined
): boolean {
  return Boolean(customer?.metadata?.[CONTACT_VERIFIED_AT_KEY])
}

export function hasSkippedContactVerification(
  customer: CustomerLike | null | undefined
): boolean {
  return Boolean(customer?.metadata?.[CONTACT_VERIFY_SKIPPED_AT_KEY])
}

/** Created before the launch cutoff — i.e. part of the migrated book. */
export function isMigratedCustomer(
  customer: CustomerLike | null | undefined
): boolean {
  if (!customer) return false
  const createdAt = customer.created_at ? new Date(customer.created_at) : null
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false
  return createdAt < new Date(CONTACT_VERIFY_CUTOFF_ISO)
}

/** Migrated customer who has neither completed nor skipped the flow. */
export function needsContactVerification(
  customer: CustomerLike | null | undefined
): boolean {
  if (!customer) return false
  if (hasCompletedContactVerification(customer)) return false
  if (hasSkippedContactVerification(customer)) return false
  return isMigratedCustomer(customer)
}

/** Skipped earlier but still unverified — surface a gentle reminder. */
export function shouldShowVerificationReminder(
  customer: CustomerLike | null | undefined
): boolean {
  if (!customer) return false
  if (hasCompletedContactVerification(customer)) return false
  if (!hasSkippedContactVerification(customer)) return false
  return isMigratedCustomer(customer)
}

export type PhoneCandidate = {
  /** digits-only, 10-digit US number */
  value: string
  /** where we saw it — helps the customer recognize it */
  sources: string[]
}

/**
 * Every distinct 10-digit US number we hold for this customer: the profile
 * phone (synced from QuickBooks) plus each saved-address phone (populated
 * from order history). Deduped digits-only; label by source.
 */
export function collectPhoneCandidates(
  customer: CustomerLike | null | undefined
): PhoneCandidate[] {
  if (!customer) return []
  const seen = new Map<string, Set<string>>()

  const add = (raw: string | null | undefined, source: string) => {
    const digits = stripPhone(raw || "")
    if (digits.length !== 10) return
    if (!seen.has(digits)) seen.set(digits, new Set())
    seen.get(digits)!.add(source)
  }

  add(customer.phone, "your account profile")
  for (const address of customer.addresses || []) {
    const label = [address.address_1, address.city]
      .filter(Boolean)
      .join(", ")
    add(address.phone, label ? `saved address (${label})` : "a saved address")
  }

  return Array.from(seen.entries()).map(([value, sources]) => ({
    value,
    sources: Array.from(sources),
  }))
}

/** (404) 643-1567 display formatting for a digits-only 10-digit number. */
export function formatPhoneForDisplay(digits: string): string {
  if (digits.length !== 10) return digits
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

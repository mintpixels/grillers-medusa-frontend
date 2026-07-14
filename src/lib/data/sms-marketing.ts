"use server"

import { revalidateTag } from "next/cache"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag } from "@lib/data/cookies"
import { retrieveAuthenticatedCustomer } from "@lib/data/customer"
import { readStaffImpersonationCookie } from "@lib/data/staff/session-cookie"
import {
  buildSmsMarketingConsentMetadata,
  formWantsSmsMarketing,
  normalizeSmsMarketingPhone,
} from "@lib/util/sms-consent"

export type SmsMarketingOptInState = {
  success: boolean
  error: string | null
  phone?: string
  receipt?: string
} | null

export type SmsMarketingStatus =
  | "subscribed"
  | "unsubscribed"
  | "not_subscribed"

export type SmsMarketingStatusResponse = {
  status: SmsMarketingStatus
  phone: string | null
  consented_at: string | null
  opted_out_at: string | null
}

const SMS_MARKETING_STATUS_PATH =
  "/store/grillers/communications/sms-marketing-status"

const CUSTOMER_ONLY_ERROR =
  "Marketing text consent can only be provided by the customer. Exit the staff customer session first."

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function parseSmsMarketingStatus(
  value: unknown
): SmsMarketingStatusResponse | null {
  const candidate = record(value)
  if (
    candidate.status !== "subscribed" &&
    candidate.status !== "unsubscribed" &&
    candidate.status !== "not_subscribed"
  ) {
    return null
  }

  return {
    status: candidate.status,
    phone: typeof candidate.phone === "string" ? candidate.phone : null,
    consented_at:
      typeof candidate.consented_at === "string" ? candidate.consented_at : null,
    opted_out_at:
      typeof candidate.opted_out_at === "string" ? candidate.opted_out_at : null,
  }
}

async function fetchSmsMarketingStatus(headers: {
  authorization: string
}): Promise<SmsMarketingStatusResponse> {
  const response = await sdk.client.fetch<unknown>(SMS_MARKETING_STATUS_PATH, {
    method: "GET",
    headers,
    cache: "no-store",
  })
  const status = parseSmsMarketingStatus(response)
  if (!status) throw new Error("Invalid marketing SMS status response")
  return status
}

/** Read the authenticated customer's send-time status; null fails closed. */
export async function retrieveSmsMarketingStatus(): Promise<SmsMarketingStatusResponse | null> {
  const headers = { ...(await getAuthHeaders()) }
  const authorization = headers.authorization
  if (!authorization) return null

  try {
    return await fetchSmsMarketingStatus({ authorization })
  } catch {
    return null
  }
}

/**
 * Signed-in, customer-controlled marketing opt-in. Phone and the complete
 * consent snapshot are written together so a consent record can never point at
 * a different profile phone. Staff impersonation fails closed before any
 * customer read or mutation.
 */
export async function submitSmsMarketingOptIn(
  _currentState: SmsMarketingOptInState,
  formData: FormData
): Promise<SmsMarketingOptInState> {
  // This is the customer's server-observed submission time, not the later
  // persistence time. Keeping it stable across every await ensures a STOP
  // received while the status request is in flight remains newer and wins.
  const submittedAt = new Date().toISOString()

  try {
    if (await readStaffImpersonationCookie()) {
      return { success: false, error: CUSTOMER_ONLY_ERROR }
    }
  } catch {
    return { success: false, error: CUSTOMER_ONLY_ERROR }
  }

  if (!formWantsSmsMarketing(formData)) {
    return {
      success: false,
      error: "Check the marketing text box to provide your consent.",
    }
  }

  const phone = normalizeSmsMarketingPhone(formData.get("phone"))
  if (!phone) {
    return {
      success: false,
      error: "Enter a valid 10-digit US mobile number.",
    }
  }

  try {
    // This deliberately bypasses retrieveCustomer(): that helper returns an
    // impersonated target. Consent must always be written as the authenticated
    // customer, never through a staff customer context.
    const customer = await retrieveAuthenticatedCustomer()
    if (!customer) {
      return { success: false, error: "Please sign in again to continue." }
    }

    const headers = { ...(await getAuthHeaders()) }
    const authorization = headers.authorization
    if (!authorization) {
      return { success: false, error: "Please sign in again to continue." }
    }

    let currentStatus: SmsMarketingStatusResponse
    try {
      currentStatus = await fetchSmsMarketingStatus({ authorization })
    } catch {
      return {
        success: false,
        error:
          "Marketing text status is temporarily unavailable. Please try again.",
      }
    }

    const stoppedPhone = normalizeSmsMarketingPhone(currentStatus.phone)
    if (
      currentStatus.status === "unsubscribed" &&
      (!stoppedPhone || stoppedPhone === phone)
    ) {
      return {
        success: false,
        error:
          "Text START to (844) 748-5332 first, then resubmit this form.",
      }
    }

    // Medusa metadata updates replace the object we send. Re-read immediately
    // before composing it so a concurrent profile update in another tab is not
    // overwritten by the snapshot loaded before the status round trip.
    const freshCustomer = await retrieveAuthenticatedCustomer()
    if (!freshCustomer || freshCustomer.id !== customer.id) {
      return { success: false, error: "Please sign in again to continue." }
    }

    const metadata = {
      ...(freshCustomer.metadata || {}),
      ...buildSmsMarketingConsentMetadata({
        phone,
        source: "account_profile",
        consentedAt: submittedAt,
      }),
    }

    await sdk.store.customer.update({ phone, metadata }, {}, headers)

    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)

    return {
      success: true,
      error: null,
      phone,
      // Each successful write changes this value, even when the phone does not,
      // so the client resets and refreshes after every affirmative submission.
      receipt: submittedAt,
    }
  } catch {
    return {
      success: false,
      error: "We couldn't save your marketing text opt-in. Please try again.",
    }
  }
}

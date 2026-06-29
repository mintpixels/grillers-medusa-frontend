import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type CheckoutPaymentSetupFailureInput = {
  stage: "setup_intent_request" | "setup_intent_response"
  reason: string
  error?: unknown
  hasAuth: boolean
  staffImpersonation?: boolean
}

type CheckoutPaymentMethodsUnavailableInput = {
  regionId: string
  providerIds: string[]
  reason: "no_payment_providers" | "stripe_card_provider_missing"
}

type SavedPaymentMethodFailureInput = {
  operation: "list" | "set_default" | "delete"
  stage:
    | "payment_context_headers"
    | "payment_methods_list"
    | "payment_method_default"
    | "payment_method_delete"
  error: unknown
  hasAuth: boolean
  staffImpersonation?: boolean
  paymentMethodId?: string | null
}

function redactedMessage(value: unknown): string | null {
  if (value === null || value === undefined) return null

  const raw =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : (() => {
            try {
              return JSON.stringify(value)
            } catch {
              return String(value)
            }
          })()

  const redacted = raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:cart|cus|pm|seti|pi|order)_[A-Za-z0-9_:-]+/g, "[id]")
    .replace(/\s+/g, " ")
    .trim()

  return redacted ? redacted.slice(0, 500) : null
}

export async function emitCheckoutPaymentSetupFailureAlert({
  stage,
  reason,
  error,
  hasAuth,
  staffImpersonation = false,
}: CheckoutPaymentSetupFailureInput) {
  await emitStorefrontOpsAlert({
    alertKind: "checkout_payment_setup_failed",
    severity: "page",
    title: "Checkout payment setup failed",
    path: "src/lib/data/payment.ts:createPaymentMethodSetupIntent",
    source: "storefront-server",
    fingerprint: `checkout_payment_setup_failed:${stage}:${reason}`,
    meta: {
      checkout_surface: "payment_setup",
      stage,
      reason,
      has_auth: hasAuth,
      staff_impersonation: staffImpersonation,
      error_message: redactedMessage(error),
    },
  })
}

export async function emitCheckoutPaymentMethodsUnavailableAlert({
  regionId,
  providerIds,
  reason,
}: CheckoutPaymentMethodsUnavailableInput) {
  await emitStorefrontOpsAlert({
    alertKind: "checkout_payment_methods_unavailable",
    severity: "page",
    title: "Checkout payment methods unavailable",
    path: "src/lib/data/payment.ts:listCartPaymentMethods",
    source: "storefront-server",
    fingerprint: `checkout_payment_methods_unavailable:${reason}`,
    meta: {
      checkout_surface: "payment_methods",
      reason,
      region_id: regionId || null,
      provider_count: providerIds.length,
      provider_ids: providerIds.slice(0, 20),
    },
  })
}

export async function emitSavedPaymentMethodFailureAlert({
  operation,
  stage,
  error,
  hasAuth,
  staffImpersonation = false,
  paymentMethodId = null,
}: SavedPaymentMethodFailureInput) {
  await emitStorefrontOpsAlert({
    alertKind: "saved_payment_method_failed",
    severity: "warn",
    title: "Saved payment method action failed",
    path: "src/lib/data/payment.ts:saved-payment-methods",
    source: "storefront-server",
    fingerprint: `saved_payment_method_failed:${operation}:${stage}`,
    meta: {
      account_surface: "saved_payment_methods",
      operation,
      stage,
      has_auth: hasAuth,
      staff_impersonation: staffImpersonation,
      has_payment_method_id: Boolean(paymentMethodId),
      error_message: redactedMessage(error),
    },
  })
}

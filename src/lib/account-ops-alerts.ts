import "server-only"

import { emitStorefrontOpsAlert } from "@lib/ops-alert"

function errorStatus(error: unknown): number | null {
  const value =
    (error as any)?.status ??
    (error as any)?.statusCode ??
    (error as any)?.response?.status
  const status = Number(value)
  return Number.isInteger(status) && status > 0 ? status : null
}

function redactedErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(
          (error as any)?.data?.message ||
            (error as any)?.message ||
            (error as any)?.statusText ||
            error ||
            "customer load failed"
        )

  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(
      /\b(?:auth|cus|customer|cart|order|ord|pay|pm|pi|provider|seti|legacy)_[A-Za-z0-9_]+/g,
      "[redacted-id]"
    )
    .slice(0, 500)
}

export function isExpectedCustomerAuthDenial(error: unknown): boolean {
  const status = errorStatus(error)
  return status === 401 || status === 403
}

export function reportAuthenticatedCustomerLoadFailure(error: unknown): void {
  if (isExpectedCustomerAuthDenial(error)) return

  const status = errorStatus(error)

  void emitStorefrontOpsAlert({
    alertKind: "account_customer_load_failed",
    severity: "page",
    title: "Authenticated customer context failed to load",
    path: "src/lib/data/customer.ts:retrieveAuthenticatedCustomer",
    source: "storefront-server",
    fingerprint: `account_customer_load_failed:${status || "transport"}`,
    meta: {
      account_surface: "authenticated_customer",
      route_dependency: "/store/customers/me",
      response_status: status,
      error_message: redactedErrorMessage(error),
    },
  }).catch(() => {
    // Fail-open: account/staff routing should not depend on alert delivery.
  })
}

export async function reportPasswordResetRequestFailure(input: {
  stage: "request_failed" | "backend_rejected"
  responseStatus?: number | null
  responseBody?: string | null
  error?: unknown
}): Promise<void> {
  try {
    await emitStorefrontOpsAlert({
      alertKind: "password_reset_request_failed",
      severity: "warn",
      title: "Password reset request failed behind neutral response",
      path: "src/lib/data/customer.ts:requestPasswordReset",
      source: "storefront-server",
      fingerprint: `password_reset_request_failed:${input.stage}:${
        input.responseStatus || "transport"
      }`,
      meta: {
        account_surface: "password_reset_request",
        route_dependency: "/store/forgot-password",
        failure_stage: input.stage,
        response_status: input.responseStatus ?? null,
        response_body: input.responseBody
          ? redactedErrorMessage(input.responseBody)
          : null,
        error_message: input.error ? redactedErrorMessage(input.error) : null,
      },
    })
  } catch {
    // Fail-open: password reset UX intentionally preserves a neutral response.
  }
}

export function reportCartAddressPersistenceFailure(input: {
  stage:
    | "auth_headers"
    | "cart_lookup"
    | "customer_lookup"
    | "shipping_address_create"
    | "billing_address_create"
    | "cache_revalidate"
  error: unknown
  cartId?: string | null
  hasShippingAddress?: boolean
  attemptedShippingAddress?: boolean
  attemptedBillingAddress?: boolean
}): void {
  void emitStorefrontOpsAlert({
    alertKind: "account_cart_address_persist_failed",
    severity: "warn",
    title: "Cart address was not saved to customer account",
    path: "src/lib/data/customer.ts:saveCartAddressesToAccount",
    source: "storefront-server",
    fingerprint: `account_cart_address_persist_failed:${input.stage}`,
    meta: {
      account_surface: "signup_cart_address_persistence",
      stage: input.stage,
      cart_id: input.cartId || null,
      has_shipping_address: Boolean(input.hasShippingAddress),
      attempted_shipping_address: Boolean(input.attemptedShippingAddress),
      attempted_billing_address: Boolean(input.attemptedBillingAddress),
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: first checkout/signup must not depend on alert delivery.
  })
}

export async function reportLegacyLoginFallbackFailure(input: {
  stage: "request_failed" | "backend_rejected"
  identifierKind: "email" | "legacy_identifier"
  responseStatus?: number | null
  responseBody?: string | null
  error?: unknown
}): Promise<void> {
  try {
    await emitStorefrontOpsAlert({
      alertKind: "legacy_login_fallback_failed",
      severity: "page",
      title: "Legacy login fallback failed behind invalid-login response",
      path: "src/lib/data/customer.ts:requestLegacyAuthToken",
      source: "storefront-server",
      fingerprint: `legacy_login_fallback_failed:${input.stage}:${
        input.responseStatus || "transport"
      }`,
      meta: {
        account_surface: "legacy_login_fallback",
        route_dependency: "/store/legacy-auth/login",
        identifier_kind: input.identifierKind,
        failure_stage: input.stage,
        response_status: input.responseStatus ?? null,
        response_body: input.responseBody
          ? redactedErrorMessage(input.responseBody)
          : null,
        error_message: input.error ? redactedErrorMessage(input.error) : null,
      },
    })
  } catch {
    // Fail-open: login UX should not depend on alert delivery.
  }
}

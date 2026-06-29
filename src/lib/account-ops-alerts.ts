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

function isExpectedLoginDenial(error: unknown): boolean {
  if (isExpectedCustomerAuthDenial(error)) return true

  const message =
    error instanceof Error
      ? error.message
      : String((error as any)?.data?.message || (error as any)?.message || "")

  return /invalid (email|login|identifier).*password|unauthorized/i.test(message)
}

function shouldAlertCustomerLoginFailure(error: unknown): boolean {
  if (isExpectedLoginDenial(error)) return false

  const status = errorStatus(error)
  return status === null || status === 404 || status === 429 || status >= 500
}

function shouldAlertPasswordLifecycleFailure(error: unknown): boolean {
  const status = errorStatus(error)
  return status === null || status === 429 || status >= 500
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

export function reportCustomerLoginFailure(input: {
  stage: "emailpass_login"
  error: unknown
  identifierKind: "email"
}): void {
  if (!shouldAlertCustomerLoginFailure(input.error)) return

  const status = errorStatus(input.error)

  void emitStorefrontOpsAlert({
    alertKind: "customer_login_failed",
    severity: "page",
    title: "Customer login failed behind invalid-login response",
    path: "src/lib/data/customer.ts:getCustomerAuthToken",
    source: "storefront-server",
    fingerprint: `customer_login_failed:${input.stage}:${
      status || "transport"
    }`,
    meta: {
      account_surface: "customer_login",
      route_dependency: "sdk.auth.login(customer,emailpass)",
      identifier_kind: input.identifierKind,
      failure_stage: input.stage,
      response_status: status,
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: login UX should not depend on alert delivery.
  })
}

export function reportCustomerSignupFailure(input: {
  stage:
    | "auth_register"
    | "auth_token"
    | "auth_headers"
    | "customer_create"
    | "emailpass_login"
    | "cache_revalidate"
    | "cart_transfer"
    | "cart_address_persistence"
  error: unknown
  hasPhone?: boolean
  smsMarketingOptIn?: boolean
}): void {
  void emitStorefrontOpsAlert({
    alertKind: "customer_signup_failed",
    severity: "page",
    title: "Customer signup failed",
    path: "src/lib/data/customer.ts:signupWithCredentials",
    source: "storefront-server",
    fingerprint: `customer_signup_failed:${input.stage}`,
    meta: {
      account_surface: "customer_signup",
      failure_stage: input.stage,
      has_phone: Boolean(input.hasPhone),
      sms_marketing_opt_in: Boolean(input.smsMarketingOptIn),
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: signup response should not depend on alert delivery.
  })
}

export function reportCustomerProfileUpdateFailure(input: {
  stage:
    | "staff_context"
    | "staff_customer_load"
    | "staff_customer_update"
    | "store_auth_headers"
    | "store_customer_update"
    | "cache_revalidate"
  error: unknown
  staffContext?: boolean
  fields?: string[]
}): void {
  void emitStorefrontOpsAlert({
    alertKind: "customer_profile_update_failed",
    severity: "warn",
    title: "Customer profile update failed",
    path: "src/lib/data/customer.ts:updateCustomer",
    source: "storefront-server",
    fingerprint: `customer_profile_update_failed:${input.stage}`,
    meta: {
      account_surface: "customer_profile_update",
      failure_stage: input.stage,
      staff_context: Boolean(input.staffContext),
      fields: (input.fields || []).slice(0, 12),
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: profile form behavior should not depend on alert delivery.
  })
}

export function reportCustomerAddressMutationFailure(input: {
  action: "create" | "update" | "delete" | "checkout_save"
  stage:
    | "staff_context"
    | "staff_customer_load"
    | "staff_address_create"
    | "staff_address_update"
    | "staff_address_delete"
    | "staff_audit_update"
    | "staff_cart_lookup"
    | "staff_cart_update"
    | "store_auth_headers"
    | "store_customer_load"
    | "store_address_create"
    | "store_address_update"
    | "store_address_delete"
    | "store_cart_lookup"
    | "store_cart_update"
    | "cache_revalidate"
  error: unknown
  staffContext?: boolean
  hasAddressId?: boolean
  hasCartId?: boolean
  fields?: string[]
}): void {
  void emitStorefrontOpsAlert({
    alertKind: "customer_address_mutation_failed",
    severity: "warn",
    title: "Customer address mutation failed",
    path: "src/lib/data/customer.ts:customer-address-actions",
    source: "storefront-server",
    fingerprint: `customer_address_mutation_failed:${input.action}:${input.stage}`,
    meta: {
      account_surface: "customer_address_mutation",
      action: input.action,
      failure_stage: input.stage,
      staff_context: Boolean(input.staffContext),
      has_address_id: Boolean(input.hasAddressId),
      has_cart_id: Boolean(input.hasCartId),
      fields: (input.fields || []).slice(0, 12),
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: address forms and checkout should not depend on alert delivery.
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

export function reportPasswordResetCompletionFailure(input: {
  error: unknown
}): void {
  if (!shouldAlertPasswordLifecycleFailure(input.error)) return

  const status = errorStatus(input.error)

  void emitStorefrontOpsAlert({
    alertKind: "password_reset_completion_failed",
    severity: "warn",
    title: "Password reset completion failed behind invalid-link response",
    path: "src/lib/data/customer.ts:completePasswordReset",
    source: "storefront-server",
    fingerprint: `password_reset_completion_failed:${status || "transport"}`,
    meta: {
      account_surface: "password_reset_completion",
      route_dependency: "sdk.auth.updateProvider(customer,emailpass)",
      response_status: status,
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: reset UI intentionally preserves the same invalid-link state.
  })
}

export function reportCustomerPasswordUpdateFailure(input: {
  stage: "auth_headers" | "store_password_update"
  error: unknown
}): void {
  if (!shouldAlertPasswordLifecycleFailure(input.error)) return

  const status = errorStatus(input.error)

  void emitStorefrontOpsAlert({
    alertKind: "customer_password_update_failed",
    severity: "warn",
    title: "Customer password update failed",
    path: "src/lib/data/customer.ts:updateCustomerPassword",
    source: "storefront-server",
    fingerprint: `customer_password_update_failed:${input.stage}:${
      status || "transport"
    }`,
    meta: {
      account_surface: "customer_password_update",
      route_dependency:
        input.stage === "store_password_update"
          ? "/store/customers/me/password"
          : "storefront auth headers",
      failure_stage: input.stage,
      response_status: status,
      error_message: redactedErrorMessage(input.error),
    },
  }).catch(() => {
    // Fail-open: password form behavior should not depend on alert delivery.
  })
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

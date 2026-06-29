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
    .replace(/\b(?:cus|cart|order|ord|pay|pm|pi|seti)_[A-Za-z0-9_]+/g, "[redacted-id]")
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

import "server-only"

import { emitStorefrontOpsAlert } from "@lib/ops-alert"

/**
 * Server-side helper for instrumenting checkout/order-path soft failures —
 * the `.catch(() => null)` sites where a fetch silently degrades and the
 * customer is left with a blank/broken state but no error is raised.
 *
 * Emits a `warn`-severity `ops_alert` (alert_kind=data_fetch_soft_fail). Stays
 * fail-open: this never throws, so the original `return null` behavior is
 * preserved exactly.
 *
 * Do NOT wire this into recipe/review/recommendation catches — those fail soft
 * by design and would flood the pager.
 */
export function reportServerSoftFailure(
  site: string,
  error: unknown,
  meta?: Record<string, unknown>
): void {
  try {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
          ? error
          : "soft failure"

    void emitStorefrontOpsAlert({
      alertKind: "data_fetch_soft_fail",
      severity: "warn",
      title: `${site}: ${message}`.slice(0, 500),
      path: site,
      source: "medusa-server",
      meta: {
        ...(meta || {}),
        message: message.slice(0, 500),
      },
    }).catch(() => {
      // Fail-open: instrumentation must never break the data path.
    })
  } catch {
    // Fail-open.
  }
}

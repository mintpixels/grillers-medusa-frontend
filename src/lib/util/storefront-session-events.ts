"use client"

export const STOREFRONT_SESSION_UPDATED_EVENT = "gp:storefront-session-updated"

export type StorefrontSessionUpdatedDetail = {
  reason:
    | "staff-impersonation-started"
    | "staff-impersonation-stopped"
    | "customer-session-changed"
}

export function dispatchStorefrontSessionUpdated(
  detail: StorefrontSessionUpdatedDetail
) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(STOREFRONT_SESSION_UPDATED_EVENT, { detail })
  )
}

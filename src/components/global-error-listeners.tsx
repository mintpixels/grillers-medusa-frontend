"use client"

import { useEffect } from "react"
import { reportClientError } from "@lib/client-error-reporter"

/**
 * Window-level error capture. Reports otherwise-invisible client errors
 * (uncaught exceptions + unhandled promise rejections) to the ops_alert pipe.
 *
 * Filters known noise that would flood paging:
 *  - ResizeObserver loop warnings (benign, browser-emitted)
 *  - errors originating from browser extension frames (chrome-extension://)
 *  - transient network aborts / "Failed to fetch" (handled by the reporter's
 *    transient-navigation classifier, but we also short-circuit obvious ones)
 */

const NOISE_NEEDLES = [
  "resizeobserver loop",
  "resizeobserver loop completed",
  "script error", // cross-origin opaque errors carry no actionable detail
]

function isNoise(message: string, source?: string | null): boolean {
  const lower = (message || "").toLowerCase()
  if (NOISE_NEEDLES.some((n) => lower.includes(n))) return true
  // Extension-originated errors are not ours to fix.
  if (source && /^(chrome-extension|moz-extension|safari-extension):/.test(source)) {
    return true
  }
  if (lower.includes("extension://")) return true
  return false
}

export default function GlobalErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || ""
      if (isNoise(message, event.filename)) return
      reportClientError({
        kind: "client_unhandled_error",
        error: event.error ?? new Error(message || "Unhandled error"),
        severity: "warn",
        extra: { source: event.filename, line: event.lineno },
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : ""
      if (isNoise(message)) return
      reportClientError({
        kind: "client_unhandledrejection",
        // Preserve structured framework errors (notably a digest-only
        // NEXT_REDIRECT signal) for the shared reporter's classification.
        // Replacing them here with a generic Error discards the digest and
        // turns successful navigation into a false production alert.
        error: reason ?? new Error(message || "Unhandled promise rejection"),
        severity: "warn",
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}

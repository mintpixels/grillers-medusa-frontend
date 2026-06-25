import { isTransientNavigationError } from "@lib/util/transient-navigation-error"

/**
 * Client-side error reporter. POSTs to the same-origin `/api/ops-alert` proxy
 * (which clamps severity + emits to gp-analytics server-side, keeping the
 * ingestion key private). Dependency-light and fail-open: reporting must never
 * throw into the page.
 *
 * Severity is a REQUEST only — the server clamps it to the per-kind ceiling.
 */

export type ClientErrorKind =
  | "client_unhandled_error"
  | "client_unhandledrejection"
  | "route_segment_error"
  | "checkout_segment_error"

export type ClientOpsAlertKind =
  | ClientErrorKind
  | "staff_module_load_failed"
  | "revenue_action_slow"

type ReportInput = {
  kind: ClientErrorKind
  error: unknown
  severity?: "page" | "warn" | "info"
  extra?: Record<string, unknown>
}

type ReportOpsInput = {
  kind: ClientOpsAlertKind
  title: string
  message?: string
  severity?: "page" | "warn" | "info"
  digest?: string | null
  extra?: Record<string, unknown>
}

const THROTTLE_MS = 60_000
const PER_PAGELOAD_CAP = 5

// Module state lives for the page load (reset on full navigation / reload).
const lastSentByFingerprint = new Map<string, number>()
let sentThisPageLoad = 0

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name || "Error"}: ${error.message || ""}`.trim()
  }
  if (typeof error === "string") return error
  try {
    return String(error)
  } catch {
    return "unknown error"
  }
}

function errorDigest(error: unknown): string | null {
  if (error && typeof error === "object" && "digest" in error) {
    const d = (error as { digest?: unknown }).digest
    if (typeof d === "string") return d
  }
  return null
}

/**
 * Lightweight client-side fingerprint for throttling. Normalizes ids/digits so
 * the same error class collapses. (The authoritative fingerprint is recomputed
 * server-side; this one only gates the client throttle.)
 */
function fingerprint(kind: string, message: string): string {
  const normalized = message
    .toLowerCase()
    .replace(/[0-9a-f]{8,}/g, "#")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
  return `${kind}:${normalized}`
}

export function reportClientError(input: ReportInput): void {
  const { kind, error, severity, extra } = input

  const errLike =
    error instanceof Error
      ? error
      : ({ message: errorMessage(error), name: "Error" } as Error)
  if (isTransientNavigationError(errLike)) return

  const message = errorMessage(error).slice(0, 500)
  reportClientOpsAlert({
    kind,
    severity,
    title: message || "Client error",
    message,
    digest: errorDigest(error),
    extra,
  })
}

export function reportClientOpsAlert(input: ReportOpsInput): void {
  try {
    if (typeof window === "undefined") return

    if (sentThisPageLoad >= PER_PAGELOAD_CAP) return

    const title = String(input.title || "Storefront ops alert").slice(0, 500)
    const message = input.message ? String(input.message).slice(0, 500) : title
    const fp = fingerprint(input.kind, `${title}:${message}`)
    const now = Date.now()
    const last = lastSentByFingerprint.get(fp)
    if (last !== undefined && now - last < THROTTLE_MS) return

    lastSentByFingerprint.set(fp, now)
    sentThisPageLoad += 1

    const body = JSON.stringify({
      alert_kind: input.kind,
      severity: input.severity,
      fingerprint: fp,
      title,
      message,
      digest: input.digest,
      url: window.location.href,
      path: window.location.pathname,
      ...(input.extra ? { extra: input.extra } : {}),
    })

    fetch("/api/ops-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Fail-open: error reporting must never break the page.
    })
  } catch {
    // Fail-open.
  }
}

import {
  buildOpsAlertFingerprint,
  emitStorefrontOpsAlert,
  type OpsAlertSeverity,
} from "@lib/ops-alert"

/**
 * SECURITY: `/api/ops-alert` is public and unauthenticated. An anonymous client
 * must never be able to mint an arbitrary `page` alert (which pages on-call via
 * `<!here>`). We constrain the blast radius with a kind→max-severity allow-map:
 *   - the kind must be in the map, and
 *   - the requested severity is CLAMPED to the map's ceiling for that kind.
 */
const SEVERITY_RANK: Record<OpsAlertSeverity, number> = {
  info: 0,
  warn: 1,
  page: 2,
}

const ALLOWED_ALERTS: Record<string, OpsAlertSeverity> = {
  transient_navigation_auto_recovery: "info",
  client_unhandled_error: "warn",
  client_unhandledrejection: "warn",
  client_add_to_cart_failed: "warn",
  client_cart_mutation_failed: "warn",
  client_profile_action_failed: "warn",
  client_search_provider_failed: "warn",
  route_segment_error: "warn",
  staff_module_load_failed: "warn",
  revenue_action_slow: "warn",
  // Checkout is the one browser-reportable kind allowed to page on-call.
  checkout_segment_error: "page",
}

const MAX_TITLE_LEN = 500
const MAX_MESSAGE_LEN = 500

type HeaderReader = {
  get(name: string): string | null
}

export function isAllowedBrowserOpsAlert(alertKind: string) {
  return Object.prototype.hasOwnProperty.call(ALLOWED_ALERTS, alertKind)
}

/**
 * Clamp a client-requested severity to the ceiling allowed for the kind.
 * Defaults to the kind's ceiling when the request is missing/garbage.
 */
export function resolveAlertSeverity(
  alertKind: string,
  requested: unknown
): OpsAlertSeverity {
  const ceiling = ALLOWED_ALERTS[alertKind]
  if (!ceiling) return "info"
  const req =
    requested === "page" || requested === "warn" || requested === "info"
      ? (requested as OpsAlertSeverity)
      : ceiling
  return SEVERITY_RANK[req] <= SEVERITY_RANK[ceiling] ? req : ceiling
}

/** Strip ASCII control chars (except none — alerts are single-line) and cap length. */
function sanitizeText(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null
  const stripped = String(value)
    // Strip ASCII control chars (C0 range + DEL) so output stays single-line.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]+/g, " ")
    .trim()
  if (!stripped) return null
  return stripped.slice(0, max)
}

function sanitizeMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const meta: Record<string, unknown> = {}
  Object.entries(value as Record<string, unknown>)
    .slice(0, 20)
    .forEach(([rawKey, rawValue]) => {
      const key = sanitizeText(rawKey, 80)
      if (!key) return

      if (
        rawValue === null ||
        typeof rawValue === "boolean" ||
        (typeof rawValue === "number" && Number.isFinite(rawValue))
      ) {
        meta[key] = rawValue
        return
      }

      if (typeof rawValue === "string") {
        meta[key] = sanitizeText(rawValue, 500)
      }
    })

  return meta
}

// ── Best-effort per-lambda token-bucket rate limit ──────────────────
// NOTE: in-memory and per-lambda-instance only. Serverless fans out across
// many instances, so this is a coarse self-DDoS guard, NOT a hard quota.
const RATE_CAPACITY = 30 // burst
const RATE_REFILL_PER_SEC = 0.5 // ~1 every 2s sustained
const RATE_TTL_MS = 10 * 60 * 1000

type Bucket = { tokens: number; updated: number }
const buckets = new Map<string, Bucket>()

export function checkRateLimit(key: string, now: number = Date.now()): boolean {
  // Opportunistic GC so the Map can't grow unbounded across a warm lambda.
  if (buckets.size > 5000) {
    const stale: string[] = []
    buckets.forEach((b, k) => {
      if (now - b.updated > RATE_TTL_MS) stale.push(k)
    })
    stale.forEach((k) => buckets.delete(k))
  }

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { tokens: RATE_CAPACITY, updated: now }
    buckets.set(key, bucket)
  }

  const elapsedSec = Math.max(0, (now - bucket.updated) / 1000)
  bucket.tokens = Math.min(
    RATE_CAPACITY,
    bucket.tokens + elapsedSec * RATE_REFILL_PER_SEC
  )
  bucket.updated = now

  if (bucket.tokens < 1) return false
  bucket.tokens -= 1
  return true
}

function clientIp(headers: HeaderReader): string {
  const fwd = headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return headers.get("x-real-ip") || "unknown"
}

export type EmitResult =
  | { ok: true; status: 202 }
  | { ok: false; status: 400; error: string }
  | { ok: false; status: 429; error: string }

export async function emitBrowserOpsAlertFromBody(
  body: any,
  headers: HeaderReader
): Promise<EmitResult> {
  const alertKind = String(body?.alert_kind || "")
  if (!isAllowedBrowserOpsAlert(alertKind)) {
    return { ok: false, status: 400, error: "invalid_alert_kind" }
  }

  const rateKey = `${clientIp(headers)}:${alertKind}`
  if (!checkRateLimit(rateKey)) {
    return { ok: false, status: 429, error: "rate_limited" }
  }

  const severity = resolveAlertSeverity(alertKind, body?.severity)
  const title =
    sanitizeText(body?.title, MAX_TITLE_LEN) || "Storefront ops alert"
  const message = sanitizeText(body?.message, MAX_MESSAGE_LEN)
  const url = sanitizeText(body?.url, 1000) || headers.get("referer")
  // Trust the client's fingerprint only for grouping; recompute as a fallback
  // so a malicious/garbage value can't poison de-duping.
  const fingerprint =
    sanitizeText(body?.fingerprint, 64) ||
    buildOpsAlertFingerprint("client", alertKind, title)

  await emitStorefrontOpsAlert({
    alertKind,
    severity,
    fingerprint,
    title,
    path: sanitizeText(body?.path, 200) || "src/app/error.tsx",
    source: "client",
    url,
    meta: {
      ...sanitizeMeta(body?.extra),
      digest: sanitizeText(body?.digest, 200),
      message,
      user_agent: sanitizeText(headers.get("user-agent"), 500),
    },
  })

  return { ok: true, status: 202 }
}

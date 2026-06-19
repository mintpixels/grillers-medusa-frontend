import { createHash, randomUUID } from "node:crypto"

export type OpsAlertSeverity = "page" | "warn" | "info"

type OpsAlertInput = {
  alertKind: string
  title: string
  path: string
  severity?: OpsAlertSeverity
  fingerprint?: string
  source?: string
  eventId?: string
  url?: string | null
  meta?: Record<string, unknown>
}

/**
 * Resolve the gp-analytics ingestion endpoint + auth for SERVER-side emission.
 *
 * The storefront reaches gp-analytics two ways:
 *  - Client: POST `/a/v1/track` (a Next.js rewrite → ingestion `/v1/track`).
 *  - Server: the rewrite is a routing-layer construct that needs an absolute
 *    URL from a server runtime, so we POST the ingestion endpoint directly.
 *
 * Prefer a dedicated server key/endpoint (mirrors the Medusa `GP_ANALYTICS_*`
 * server pattern) and fall back to the public client endpoint/key that the
 * `jitsuTrack` dual-run mirror already uses to reach the same ingestion API.
 */
function resolveIngestion(): { url: string; key: string } | null {
  const endpoint = (
    process.env.GP_ANALYTICS_ENDPOINT ||
    process.env.NEXT_PUBLIC_GP_ANALYTICS_ENDPOINT ||
    ""
  ).replace(/\/+$/, "")
  const key =
    process.env.GP_ANALYTICS_SERVER_KEY ||
    process.env.NEXT_PUBLIC_GP_ANALYTICS_CLIENT_KEY ||
    ""

  if (!endpoint || !key) return null
  return { url: `${endpoint}/v1/track`, key }
}

/**
 * Stable fingerprint for de-duping / grouping alerts. Strips ids and digits
 * from the title so e.g. `cart_abc123 failed` and `cart_def456 failed` collapse
 * to one fingerprint, matching the backend's sha1(source:kind:normalizedTitle).
 */
export function buildOpsAlertFingerprint(
  source: string,
  alertKind: string,
  title: string
): string {
  const normalizedTitle = String(title || "")
    .toLowerCase()
    // collapse hex/uuid-ish ids and bare digit runs to a placeholder
    .replace(/[0-9a-f]{8,}/g, "#")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
  return createHash("sha1")
    .update(`${source}:${alertKind}:${normalizedTitle}`)
    .digest("hex")
}

export async function emitStorefrontOpsAlert(input: OpsAlertInput) {
  const ingestion = resolveIngestion()

  if (!ingestion) {
    console.warn(
      `[ops-alert] skipped ${input.alertKind}: GP_ANALYTICS endpoint/key missing`
    )
    return { ok: false, skipped: true }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)
  const source = input.source || "medusa-server"
  const severity: OpsAlertSeverity = input.severity || "warn"
  const fingerprint =
    input.fingerprint ||
    buildOpsAlertFingerprint(source, input.alertKind, input.title)

  // Contract shared with the backend: ClickHouse grillers_pride.events with
  // event_name='ops_alert' and properties carrying alert_kind/severity/
  // fingerprint/path/title/release/env (+ any extra meta). The ops-pager
  // consumer reads severity IN ('page','warn') and posts to Slack.
  const payload = {
    event: "ops_alert",
    event_id: input.eventId || randomUUID(),
    event_timestamp_ms: Date.now(),
    source,
    properties: {
      ...(input.meta || {}),
      alert_kind: input.alertKind,
      severity,
      fingerprint,
      path: input.path,
      title: input.title,
      url: input.url || null,
      release: process.env.NEXT_PUBLIC_RELEASE_SHA || null,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    },
    context: {
      library: {
        name: "grillers-medusa-frontend-ops-alert",
        version: "0.2.0",
      },
    },
  }

  try {
    const response = await fetch(ingestion.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ingestion.key}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(
        `[ops-alert] ${input.alertKind} failed: ${response.status} ${response.statusText}`
      )
      return { ok: false, skipped: false }
    }

    return { ok: true, skipped: false }
  } catch (error) {
    // Fail open: ops alerting must never break a request path.
    console.error(`[ops-alert] ${input.alertKind} failed:`, error)
    return { ok: false, skipped: false }
  } finally {
    clearTimeout(timeout)
  }
}

import { createHash, randomUUID } from "node:crypto"

export type StorefrontOpsAlertSeverity = "page" | "warn" | "info"

type OpsAlertInput = {
  alertKind: string
  title: string
  path: string
  source?: string
  eventId?: string
  url?: string | null
  severity?: StorefrontOpsAlertSeverity
  fingerprint?: string
  meta?: Record<string, unknown>
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
      ""
    )
    .replace(
      /\b(?:order|cart|pi|fin|refund|attempt|prod|variant)_[a-z0-9_]+/g,
      ""
    )
    .replace(/\d+/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function computeFingerprint(source: string, alertKind: string, title: string) {
  return createHash("sha1")
    .update(`${source}:${alertKind}:${normalizeTitle(title)}`)
    .digest("hex")
}

export async function emitStorefrontOpsAlert(input: OpsAlertInput) {
  const analyticsEndpoint = process.env.GP_ANALYTICS_ENDPOINT?.replace(/\/+$/, "")
  const analyticsServerKey = process.env.GP_ANALYTICS_SERVER_KEY
  const host = process.env.JITSU_HOST?.replace(/\/+$/, "")
  const secret = process.env.JITSU_SERVER_SECRET

  if ((!analyticsEndpoint || !analyticsServerKey) && (!host || !secret)) {
    console.warn(
      `[ops-alert] skipped ${input.alertKind}: GP_ANALYTICS_ENDPOINT/GP_ANALYTICS_SERVER_KEY or JITSU_HOST/JITSU_SERVER_SECRET missing`
    )
    return { ok: false, skipped: true }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)
  const ts = new Date().toISOString()
  const source = input.source || "storefront"
  const severity: StorefrontOpsAlertSeverity = input.severity ?? "warn"
  const fingerprint =
    input.fingerprint || computeFingerprint(source, input.alertKind, input.title)

  if (analyticsEndpoint && analyticsServerKey) {
    const payload = {
      event: "ops_alert",
      event_id: input.eventId || randomUUID(),
      event_timestamp_ms: Date.now(),
      session_id: randomUUID(),
      anonymous_id: randomUUID(),
      experience_version: "storefront",
      route_market: "national",
      customer_type: "dtc",
      source,
      properties: {
        alert_kind: input.alertKind,
        severity,
        fingerprint,
        path: input.path,
        title: input.title,
        url: input.url || null,
        release:
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
          null,
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
        ...(input.meta || {}),
      },
      context: {
        library: {
          name: "grillers-medusa-frontend-ops-alert",
          version: "0.2.0",
        },
      },
    }

    try {
      const response = await fetch(`${analyticsEndpoint}/v1/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${analyticsServerKey}`,
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
      console.error(`[ops-alert] ${input.alertKind} failed:`, error)
      return { ok: false, skipped: false }
    } finally {
      clearTimeout(timeout)
    }
  }

  if (!host || !secret) {
    console.warn(
      `[ops-alert] skipped ${input.alertKind}: JITSU_HOST/JITSU_SERVER_SECRET missing`
    )
    clearTimeout(timeout)
    return { ok: false, skipped: true }
  }

  const payload = {
    event_type: "ops.alert",
    eventn_ctx: {
      event_id: input.eventId || randomUUID(),
      event_timestamp_ms: Date.now(),
      ts,
      source,
      title: input.title,
      url: input.url || null,
      meta: {
        ...(input.meta || {}),
        alert_kind: input.alertKind,
        severity,
        fingerprint,
        path: input.path,
      },
      ops_namespace: "ops_timeline",
    },
  }

  try {
    const response = await fetch(`${host}/api/v1/s2s/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": secret,
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
    console.error(`[ops-alert] ${input.alertKind} failed:`, error)
    return { ok: false, skipped: false }
  } finally {
    clearTimeout(timeout)
  }
}

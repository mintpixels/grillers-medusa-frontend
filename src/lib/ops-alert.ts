import { randomUUID } from "node:crypto"

type OpsAlertInput = {
  alertKind: string
  title: string
  path: string
  source?: string
  eventId?: string
  url?: string | null
  meta?: Record<string, unknown>
}

export async function emitStorefrontOpsAlert(input: OpsAlertInput) {
  const host = process.env.JITSU_HOST?.replace(/\/+$/, "")
  const secret = process.env.JITSU_SERVER_SECRET

  if (!host || !secret) {
    console.warn(
      `[ops-alert] skipped ${input.alertKind}: JITSU_HOST/JITSU_SERVER_SECRET missing`
    )
    return { ok: false, skipped: true }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)
  const ts = new Date().toISOString()
  const payload = {
    event_type: "ops.alert",
    eventn_ctx: {
      event_id: input.eventId || randomUUID(),
      event_timestamp_ms: Date.now(),
      ts,
      source: input.source || "storefront",
      title: input.title,
      url: input.url || null,
      meta: {
        ...(input.meta || {}),
        alert_kind: input.alertKind,
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

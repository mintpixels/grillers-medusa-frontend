import { jitsuAnalytics, AnalyticsInterface } from "@jitsu/js"

let instance: AnalyticsInterface | null = null

let globalContext: Record<string, string> = {
  experience_version: "medusa",
  route_market: "unknown",
  customer_type: "unknown",
}

/**
 * Returns the Jitsu analytics singleton. Returns null on the server
 * or when env vars are missing.
 */
export function getJitsu(): AnalyticsInterface | null {
  if (typeof window === "undefined") return null
  if (instance) return instance

  const host = process.env.NEXT_PUBLIC_JITSU_HOST
  const writeKey = process.env.NEXT_PUBLIC_JITSU_WRITE_KEY
  if (!host || !writeKey) return null

  instance = jitsuAnalytics({ host, writeKey })
  return instance
}

/**
 * Track a named event with properties. Automatically injects global
 * parameters (event_id, event_timestamp_ms, experience_version,
 * route_market, customer_type). Jitsu handles anonymous_id and
 * session_id natively.
 */
export function jitsuTrack(
  event: string,
  properties?: Record<string, any>
) {
  getJitsu()?.track(event, {
    event_id: crypto.randomUUID(),
    event_timestamp_ms: Date.now(),
    ...globalContext,
    ...properties,
  })
}

/**
 * Identify a known user. Call on login or account creation.
 */
export function jitsuIdentify(
  userId: string,
  traits?: Record<string, any>
) {
  getJitsu()?.identify(userId, traits)
}

/**
 * Track a page view. Called automatically by JitsuScript on route changes.
 */
export function jitsuPage(properties?: Record<string, any>) {
  getJitsu()?.page({
    event_id: crypto.randomUUID(),
    event_timestamp_ms: Date.now(),
    ...globalContext,
    ...properties,
  })
}

/**
 * Update global context that is attached to every subsequent event.
 * Call when delivery zone is selected (route_market) or customer
 * type becomes known (customer_type).
 */
export function setJitsuContext(
  ctx: Partial<typeof globalContext>
) {
  globalContext = { ...globalContext, ...ctx }
}

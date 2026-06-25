/**
 * Jitsu analytics client — sends events to the Jitsu Classic server
 * via /api/v1/event endpoint with token-based auth.
 *
 * The @jitsu/js SDK uses the newer /api/s/ format which is incompatible
 * with our jitsucom/server:latest instance, so we use direct fetch.
 */

const COOKIE_ANON_ID = "_gp_anon_id"
const COOKIE_USER_ID = "_gp_user_id"
const COOKIE_SESSION_ID = "_gp_session_id"
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

let globalContext: Record<string, string> = {
  experience_version: "medusa",
  route_market: "unknown",
  customer_type: "unknown",
}

let experimentContext: Record<string, any> = {}
let userTraits: Record<string, any> = {}

type GpAnalyticsPayload = {
  event: string
  event_id: string
  event_timestamp_ms: number
  anonymous_id?: string
  user_id?: string
  session_id: string
  experience_version: "legacy" | "medusa"
  route_market: "atlanta_metro" | "southeast" | "national" | "unknown"
  fulfillment_tier?: string | null
  customer_type: "dtc" | "institutional" | "unknown"
  source: "client"
  properties: Record<string, any>
  context: Record<string, any>
}

const GP_ANALYTICS_CONTEXT_KEYS = new Set([
  "anonymous_id",
  "customer_type",
  "event_id",
  "event_timestamp_ms",
  "experience_version",
  "experiment_context",
  "fulfillment_tier",
  "locale",
  "page",
  "route_market",
  "screen",
  "session_id",
  "timezone",
  "user",
  "user_agent",
  "user_id",
])

function getUserId(): string | undefined {
  return getCookie(COOKIE_USER_ID) || undefined
}

// ── Cookie helpers ──────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  try {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
    return match ? decodeURIComponent(match[2]) : null
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return
  try {
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? ";Secure"
        : ""
    document.cookie = `${name}=${encodeURIComponent(
      value
    )};path=/;max-age=${maxAgeSec};SameSite=Lax${secure}`
  } catch {
    // Analytics identifiers are optional. Storage failures must not affect UX.
  }
}

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID()
    }
  } catch {
    // Fall through to a local fallback for constrained browser contexts.
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

function shouldSkipRemoteDevelopmentIngestion(endpoint: string): boolean {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.NEXT_PUBLIC_COMMUNICATIONS_ALLOW_REMOTE_DEV_INGESTION ===
      "true" ||
    typeof window === "undefined"
  ) {
    return false
  }

  try {
    const pageUrl = new URL(window.location.href)
    const endpointUrl = new URL(endpoint, pageUrl.origin)
    return (
      isLocalDevelopmentHost(pageUrl.hostname) &&
      !isLocalDevelopmentHost(endpointUrl.hostname) &&
      endpointUrl.origin !== pageUrl.origin
    )
  } catch {
    return false
  }
}

// ── Anonymous ID (persists across sessions, 1-year expiry) ──────

function getAnonymousId(): string {
  let id = getCookie(COOKIE_ANON_ID)
  if (!id) {
    id = randomId()
    setCookie(COOKIE_ANON_ID, id, 365 * 24 * 60 * 60)
  }
  return id
}

// ── Session ID (30-min sliding window) ──────────────────────────

function getSessionId(): string {
  let id = getCookie(COOKIE_SESSION_ID)
  if (!id) {
    id = randomId()
  }
  // Reset the sliding expiry on every call
  setCookie(COOKIE_SESSION_ID, id, SESSION_TIMEOUT_MS / 1000)
  return id
}

export function getJitsuIdentityContext(): {
  anonymous_id: string
  session_id: string
  user_id?: string
} {
  return {
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    user_id: getUserId(),
  }
}

export function getJitsuContextSnapshot(): Record<
  string,
  string | undefined
> & {
  anonymous_id: string
  session_id: string
  user_id?: string
} {
  return {
    ...globalContext,
    ...getJitsuIdentityContext(),
  }
}

// ── Send event to Jitsu Classic /api/v1/event ───────────────────

function sendEvent(payload: Record<string, any>) {
  if (typeof window === "undefined") return

  const host = process.env.NEXT_PUBLIC_JITSU_HOST
  const token = process.env.NEXT_PUBLIC_JITSU_WRITE_KEY
  const body = JSON.stringify(payload)

  if (host && token) {
    const url = `${host}/api/v1/event?token=${token}`
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silent fail — don't break the app for analytics
      })
    } catch {
      // Silent fail
    }
  }

  const communicationsUrl = (
    process.env.NEXT_PUBLIC_COMMUNICATIONS_INGESTION_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "")
  const communicationsKey = process.env.NEXT_PUBLIC_COMMUNICATIONS_API_KEY

  if (
    communicationsUrl &&
    !shouldSkipRemoteDevelopmentIngestion(communicationsUrl)
  ) {
    try {
      fetch(`${communicationsUrl}/api/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communicationsKey ? { "x-api-key": communicationsKey } : {}),
        },
        body,
        keepalive: true,
      }).catch(() => {
        // Silent fail — first-party lifecycle capture must not affect UX.
      })
    } catch {
      // Silent fail
    }
  }

  sendGpAnalyticsMirror(payload)
}

function normalizeRouteMarket(
  value: unknown
): GpAnalyticsPayload["route_market"] {
  if (
    value === "atlanta_metro" ||
    value === "southeast" ||
    value === "national"
  ) {
    return value
  }
  if (value === "core") {
    return "atlanta_metro"
  }
  if (value === "scheduled_pod") {
    return "southeast"
  }
  return "unknown"
}

function normalizeCustomerType(
  value: unknown
): GpAnalyticsPayload["customer_type"] {
  return value === "dtc" || value === "institutional" ? value : "unknown"
}

function sendGpAnalyticsMirror(payload: Record<string, any>) {
  const endpoint = process.env.NEXT_PUBLIC_GP_ANALYTICS_ENDPOINT
  const apiKey = process.env.NEXT_PUBLIC_GP_ANALYTICS_CLIENT_KEY
  const clientPath = process.env.NEXT_PUBLIC_GP_ANALYTICS_CLIENT_PATH || "/a"
  const dualRunEnabled =
    process.env.NEXT_PUBLIC_GP_ANALYTICS_DUAL_RUN !== "false"

  if (!endpoint || !apiKey || !dualRunEnabled) return

  try {
    const ctx = payload.eventn_ctx || {}
    const {
      eventn_ctx: _eventContext,
      event_type: _eventType,
      ...properties
    } = payload
    const eventProperties = Object.fromEntries(
      Object.entries(ctx).filter(([key]) => !GP_ANALYTICS_CONTEXT_KEYS.has(key))
    )
    const body: GpAnalyticsPayload = {
      event: String(payload.event_type || "unknown"),
      event_id: String(ctx.event_id || randomId()),
      event_timestamp_ms:
        typeof ctx.event_timestamp_ms === "number"
          ? ctx.event_timestamp_ms
          : Date.now(),
      anonymous_id:
        typeof ctx.anonymous_id === "string" ? ctx.anonymous_id : undefined,
      user_id: typeof ctx.user_id === "string" ? ctx.user_id : undefined,
      session_id:
        typeof ctx.session_id === "string" ? ctx.session_id : getSessionId(),
      experience_version:
        ctx.experience_version === "legacy" ? "legacy" : "medusa",
      route_market: normalizeRouteMarket(ctx.route_market),
      fulfillment_tier:
        typeof ctx.fulfillment_tier === "string" ? ctx.fulfillment_tier : null,
      customer_type: normalizeCustomerType(ctx.customer_type),
      source: "client",
      properties: {
        ...properties,
        ...eventProperties,
        ...(ctx.experiment_context
          ? { experiment_context: ctx.experiment_context }
          : {}),
      },
      context: {
        page: ctx.page,
        screen: ctx.screen,
        locale: ctx.locale,
        timezone: ctx.timezone,
        userAgent: ctx.user_agent,
        library: {
          name: "grillers-medusa-frontend-jitsu-dual-run",
          version: "0.1.0",
        },
      },
    }

    fetch(`${clientPath.replace(/\/$/, "")}/v1/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      keepalive: true,
    })
      .then((res) => {
        if (res && !res.ok) {
          console.warn("[gp-analytics] mirror returned non-2xx", {
            status: res.status,
            statusText: res.statusText,
          })
        }
      })
      .catch(() => {
        // Dual-run analytics must never affect storefront UX.
      })
  } catch {
    // Dual-run analytics must never affect storefront UX.
  }
}

// ── Build the event envelope ────────────────────────────────────

function buildEvent(
  eventType: string,
  properties?: Record<string, any>
): Record<string, any> {
  const anonymousId = getAnonymousId()
  const sessionId = getSessionId()
  const resolvedUserId = getUserId()
  const activeExperimentContext = Object.keys(experimentContext).length
    ? experimentContext
    : undefined

  return {
    event_type: eventType,
    eventn_ctx: {
      event_id: randomId(),
      event_timestamp_ms: Date.now(),
      anonymous_id: anonymousId,
      session_id: sessionId,
      user_id: resolvedUserId,
      ...globalContext,
      ...(activeExperimentContext
        ? { experiment_context: activeExperimentContext }
        : {}),
      user: resolvedUserId
        ? { anonymous_id: anonymousId, id: resolvedUserId, ...userTraits }
        : { anonymous_id: anonymousId },
      page: {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        title: document.title,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      user_agent: navigator.userAgent,
    },
    ...properties,
  }
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Track a named event with properties. Automatically injects global
 * parameters and context (anonymous_id, session_id, page, screen, etc.)
 */
export function jitsuTrack(event: string, properties?: Record<string, any>) {
  try {
    const payload = buildEvent(event, { src: "jitsu_track" })
    payload.event_type = event
    if (properties) {
      payload.eventn_ctx = { ...payload.eventn_ctx, ...properties }
    }
    sendEvent(payload)
  } catch {
    // Silent fail — analytics should never trip a route error boundary.
  }
}

/**
 * Identify a known user. Call on login or account creation.
 * Subsequent events will include the user_id.
 */
export function jitsuIdentify(id: string, traits?: Record<string, any>) {
  try {
    // Persist user_id in a 1-year cookie so identity survives logout
    setCookie(COOKIE_USER_ID, id, 365 * 24 * 60 * 60)
    if (traits) userTraits = { ...userTraits, ...traits }

    const payload = buildEvent("identify")
    payload.eventn_ctx.user = {
      anonymous_id: getAnonymousId(),
      id,
      ...userTraits,
    }
    sendEvent(payload)
  } catch {
    // Silent fail
  }
}

/**
 * Track a page view. Called automatically by JitsuScript on route changes.
 */
export function jitsuPage(properties?: Record<string, any>) {
  try {
    const payload = buildEvent("page_viewed")
    if (properties) {
      payload.eventn_ctx = { ...payload.eventn_ctx, ...properties }
    }
    sendEvent(payload)
  } catch {
    // Silent fail
  }
}

/**
 * Update global context that is attached to every subsequent event.
 * Call when delivery zone is selected (route_market) or customer
 * type becomes known (customer_type).
 */
export function setJitsuContext(ctx: Partial<typeof globalContext>) {
  const next = { ...globalContext }
  for (const [key, value] of Object.entries(ctx)) {
    if (typeof value === "string") {
      next[key] = value
    }
  }
  globalContext = next
}

export function setJitsuExperimentContext(ctx: Record<string, any>) {
  experimentContext = { ...ctx }
}

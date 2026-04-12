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

let userTraits: Record<string, any> = {}

function getUserId(): string | undefined {
  return getCookie(COOKIE_USER_ID) || undefined
}

// ── Cookie helpers ──────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSec};SameSite=Lax;Secure`
}

// ── Anonymous ID (persists across sessions, 1-year expiry) ──────

function getAnonymousId(): string {
  let id = getCookie(COOKIE_ANON_ID)
  if (!id) {
    id = crypto.randomUUID()
    setCookie(COOKIE_ANON_ID, id, 365 * 24 * 60 * 60)
  }
  return id
}

// ── Session ID (30-min sliding window) ──────────────────────────

function getSessionId(): string {
  let id = getCookie(COOKIE_SESSION_ID)
  if (!id) {
    id = crypto.randomUUID()
  }
  // Reset the sliding expiry on every call
  setCookie(COOKIE_SESSION_ID, id, SESSION_TIMEOUT_MS / 1000)
  return id
}

// ── Send event to Jitsu Classic /api/v1/event ───────────────────

function sendEvent(payload: Record<string, any>) {
  if (typeof window === "undefined") return

  const host = process.env.NEXT_PUBLIC_JITSU_HOST
  const token = process.env.NEXT_PUBLIC_JITSU_WRITE_KEY
  if (!host || !token) return

  const url = `${host}/api/v1/event?token=${token}`

  // Use sendBeacon if the page is being unloaded, fetch otherwise
  const body = JSON.stringify(payload)

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

// ── Build the event envelope ────────────────────────────────────

function buildEvent(
  eventType: string,
  properties?: Record<string, any>
): Record<string, any> {
  const anonymousId = getAnonymousId()
  const sessionId = getSessionId()
  const resolvedUserId = getUserId()

  return {
    event_type: eventType,
    eventn_ctx: {
      event_id: crypto.randomUUID(),
      event_timestamp_ms: Date.now(),
      anonymous_id: anonymousId,
      session_id: sessionId,
      user_id: resolvedUserId,
      ...globalContext,
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
export function jitsuTrack(
  event: string,
  properties?: Record<string, any>
) {
  const payload = buildEvent(event, { src: "jitsu_track" })
  payload.event_type = event
  if (properties) {
    payload.eventn_ctx = { ...payload.eventn_ctx, ...properties }
  }
  sendEvent(payload)
}

/**
 * Identify a known user. Call on login or account creation.
 * Subsequent events will include the user_id.
 */
export function jitsuIdentify(
  id: string,
  traits?: Record<string, any>
) {
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
}

/**
 * Track a page view. Called automatically by JitsuScript on route changes.
 */
export function jitsuPage(properties?: Record<string, any>) {
  const payload = buildEvent("page_viewed")
  if (properties) {
    payload.eventn_ctx = { ...payload.eventn_ctx, ...properties }
  }
  sendEvent(payload)
}

/**
 * Update global context that is attached to every subsequent event.
 * Call when delivery zone is selected (route_market) or customer
 * type becomes known (customer_type).
 */
export function setJitsuContext(ctx: Partial<typeof globalContext>) {
  globalContext = { ...globalContext, ...ctx }
}

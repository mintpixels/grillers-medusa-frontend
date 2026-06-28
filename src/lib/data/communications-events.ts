"use server"

import { emitStorefrontOpsAlert } from "@lib/ops-alert"

type CommunicationEventInput = {
  event_name: string
  event_id?: string
  source?: string
  email?: string
  medusa_customer_id?: string
  anonymous_id?: string
  session_id?: string
  cart_id?: string
  order_id?: string
  customer_type?: string
  route_market?: string
  campaign_id?: string
  flow_id?: string
  template_key?: string
  properties?: Record<string, unknown>
  context?: Record<string, unknown>
}

const ALERT_PATH = "src/lib/data/communications-events.ts"

function communicationsUrl() {
  return (
    process.env.NEWSLETTER_SERVICE_URL ||
    process.env.COMMUNICATIONS_SERVICE_URL ||
    process.env.NEXT_PUBLIC_COMMUNICATIONS_INGESTION_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "")
}

function redactedErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "")
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .slice(0, 300)
}

function emitCommunicationEventForwardingAlert(input: {
  event: CommunicationEventInput
  stage: "non_2xx" | "request_failed"
  status?: number | null
  error?: unknown
}) {
  void emitStorefrontOpsAlert({
    alertKind: "communications_event_forwarding_failed",
    severity: "warn",
    title: `Communications event forwarding failed for ${input.event.event_name}`,
    path: ALERT_PATH,
    source: "storefront-server",
    meta: {
      stage: input.stage,
      response_status: input.status ?? null,
      event_name: input.event.event_name,
      event_id: input.event.event_id || null,
      event_source: input.event.source || "storefront-server",
      order_id: input.event.order_id || null,
      cart_id: input.event.cart_id || null,
      campaign_id: input.event.campaign_id || null,
      flow_id: input.event.flow_id || null,
      template_key: input.event.template_key || null,
      has_email: Boolean(input.event.email),
      error_message: input.error ? redactedErrorMessage(input.error) : null,
    },
  }).catch(() => {
    // Fail-open: telemetry must never affect the customer action.
  })
}

export async function trackCommunicationEvent(input: CommunicationEventInput) {
  const url = communicationsUrl()
  if (!url) return

  const key =
    process.env.NEWSLETTER_API_KEY ||
    process.env.COMMUNICATIONS_API_KEY ||
    process.env.NEXT_PUBLIC_COMMUNICATIONS_API_KEY

  try {
    const response = await fetch(`${url}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "x-api-key": key } : {}),
      },
      body: JSON.stringify({
        event_name: input.event_name,
        event_id: input.event_id,
        source: input.source || "storefront-server",
        email: input.email,
        customer_id: input.medusa_customer_id,
        anonymous_id: input.anonymous_id,
        session_id: input.session_id,
        cart_id: input.cart_id,
        order_id: input.order_id,
        customer_type: input.customer_type,
        route_market: input.route_market,
        campaign_id: input.campaign_id,
        flow_id: input.flow_id,
        template_key: input.template_key,
        properties: input.properties || {},
        context: input.context || {},
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      emitCommunicationEventForwardingAlert({
        event: input,
        stage: "non_2xx",
        status: response.status,
        error:
          typeof response.text === "function"
            ? await response.text().catch(() => response.statusText)
            : response.statusText,
      })
    }
  } catch (error) {
    emitCommunicationEventForwardingAlert({
      event: input,
      stage: "request_failed",
      error,
    })
    // Lifecycle event capture must never affect customer actions.
  }
}

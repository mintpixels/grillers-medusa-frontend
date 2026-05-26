"use server"

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

function communicationsUrl() {
  return (
    process.env.NEWSLETTER_SERVICE_URL ||
    process.env.COMMUNICATIONS_SERVICE_URL ||
    process.env.NEXT_PUBLIC_COMMUNICATIONS_INGESTION_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "")
}

export async function trackCommunicationEvent(input: CommunicationEventInput) {
  const url = communicationsUrl()
  if (!url) return

  const key =
    process.env.NEWSLETTER_API_KEY ||
    process.env.COMMUNICATIONS_API_KEY ||
    process.env.NEXT_PUBLIC_COMMUNICATIONS_API_KEY

  try {
    await fetch(`${url}/api/track`, {
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
    }).catch(() => undefined)
  } catch {
    // Lifecycle event capture must never affect customer actions.
  }
}

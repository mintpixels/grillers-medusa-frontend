import { trackCommunicationEvent } from "@lib/data/communications-events"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("communications event forwarding alerts", () => {
  const originalEnv = { ...process.env }
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      COMMUNICATIONS_SERVICE_URL: "https://medusa.example.com/",
      COMMUNICATIONS_API_KEY: "service-key",
    }
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 202,
      statusText: "Accepted",
    })) as any
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    global.fetch = originalFetch
  })

  it("does not alert when the communications endpoint accepts the event", async () => {
    await trackCommunicationEvent({
      event_name: "waitlist_joined",
      event_id: "waitlist_joined:req_123",
      email: "shopper@example.com",
      template_key: "back-in-stock-confirm",
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "https://medusa.example.com/api/track",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-api-key": "service-key",
        }),
      })
    )
    expect(emitStorefrontOpsAlertMock).not.toHaveBeenCalled()
  })

  it("alerts with safe metadata when the communications endpoint rejects the event", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "ingestion failed for shopper@example.com",
    })) as any

    await trackCommunicationEvent({
      event_name: "waitlist_joined",
      event_id: "waitlist_joined:req_123",
      source: "storefront-server",
      email: "shopper@example.com",
      cart_id: "cart_123",
      template_key: "back-in-stock-confirm",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "communications_event_forwarding_failed",
        severity: "warn",
        title: "Communications event forwarding failed for waitlist_joined",
        path: "src/lib/data/communications-events.ts",
        source: "storefront-server",
        meta: expect.objectContaining({
          stage: "non_2xx",
          response_status: 503,
          event_name: "waitlist_joined",
          event_id: "waitlist_joined:req_123",
          event_source: "storefront-server",
          cart_id: "cart_123",
          template_key: "back-in-stock-confirm",
          has_email: true,
          error_message: "ingestion failed for [redacted-email]",
        }),
      })
    )
    expect(
      JSON.stringify(emitStorefrontOpsAlertMock.mock.calls[0][0].meta)
    ).not.toContain("shopper@example.com")
  })

  it("alerts with safe metadata when the communications request throws", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("network reset for shopper@example.com"))

    await trackCommunicationEvent({
      event_name: "back_in_stock_notification_sent",
      event_id: "back_in_stock_notification_sent:req_123",
      email: "shopper@example.com",
      template_key: "back-in-stock-restocked",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "communications_event_forwarding_failed",
        meta: expect.objectContaining({
          stage: "request_failed",
          response_status: null,
          event_name: "back_in_stock_notification_sent",
          error_message: "network reset for [redacted-email]",
        }),
      })
    )
  })
})

import { requestBackInStockNotification } from "@lib/data/back-in-stock"
import { trackCommunicationEvent } from "@lib/data/communications-events"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { sendTemplatedEmail } from "@lib/postmark"

jest.mock("@lib/postmark", () => ({
  sendTemplatedEmail: jest.fn(),
}))

jest.mock("@lib/data/communications-events", () => ({
  trackCommunicationEvent: jest.fn(async () => undefined),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>
const sendTemplatedEmailMock = sendTemplatedEmail as jest.MockedFunction<
  typeof sendTemplatedEmail
>
const trackCommunicationEventMock =
  trackCommunicationEvent as jest.MockedFunction<typeof trackCommunicationEvent>

describe("back-in-stock alerting", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined)
    process.env = {
      ...originalEnv,
      STRAPI_ENDPOINT: "https://strapi.example.com",
      STRAPI_API_TOKEN: "strapi-token",
      NEXT_PUBLIC_BASE_URL: "https://www.grillerspride.com",
    }
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it("alerts and returns an error when Strapi cannot persist the request", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "persist failed for shopper@example.com",
      }) as any

    const result = await requestBackInStockNotification({
      email: "shopper@example.com",
      medusaProductId: "prod_123",
      medusaVariantId: "variant_123",
      productHandle: "first-cut-brisket",
      productTitle: "First Cut Brisket",
      sku: "10-01-01",
      source: "pdp",
    })

    expect(result).toEqual({
      ok: false,
      error: "We couldn't save your request. Please try again.",
    })
    expect(sendTemplatedEmailMock).not.toHaveBeenCalled()
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "back_in_stock_capture_failed",
        path: "src/lib/data/back-in-stock.ts",
        meta: expect.objectContaining({
          stage: "strapi_persist",
          status: 500,
          medusa_product_id: "prod_123",
          medusa_variant_id: "variant_123",
          product_handle: "first-cut-brisket",
          sku: "10-01-01",
          source: "pdp",
          waitlist_reason: "out_of_stock",
          error_message: "persist failed for [email]",
        }),
      })
    )
  })

  it("alerts but keeps capture fail-open when duplicate lookup fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ error: "lookup unavailable" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 7, documentId: "bis_doc_7" } }),
      }) as any
    sendTemplatedEmailMock.mockResolvedValue({
      ok: true,
      messageId: "msg_123",
    })

    const result = await requestBackInStockNotification({
      email: "shopper@example.com",
      medusaProductId: "prod_123",
      medusaVariantId: "variant_123",
      productHandle: "first-cut-brisket",
      productTitle: "First Cut Brisket",
      sku: "10-01-01",
      source: "pdp",
    })

    expect(result).toEqual({ ok: true })
    expect(sendTemplatedEmailMock).toHaveBeenCalled()
    expect(trackCommunicationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "waitlist_joined",
        properties: expect.objectContaining({
          confirmation_email_sent: true,
          strapi_id: "bis_doc_7",
        }),
      })
    )
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "back_in_stock_capture_failed",
        fingerprint: "back_in_stock:dedupe_lookup:503",
        meta: expect.objectContaining({
          stage: "dedupe_lookup",
          status: 503,
          medusa_product_id: "prod_123",
          medusa_variant_id: "variant_123",
          product_handle: "first-cut-brisket",
          sku: "10-01-01",
          source: "pdp",
          waitlist_reason: "out_of_stock",
        }),
      })
    )
    expect(JSON.stringify(emitStorefrontOpsAlertMock.mock.calls)).not.toContain(
      "shopper@example.com"
    )
  })

  it("alerts but keeps the subscriber saved when confirmation email fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 7, documentId: "bis_doc_7" } }),
      }) as any
    sendTemplatedEmailMock.mockResolvedValue({
      ok: false,
      message: "Postmark rejected shopper@example.com",
    })

    const result = await requestBackInStockNotification({
      email: "shopper@example.com",
      medusaProductId: "prod_123",
      medusaVariantId: "variant_123",
      productHandle: "first-cut-brisket",
      productTitle: "First Cut Brisket",
      sku: "10-01-01",
      waitlistReason: "allocated_out",
      source: "side_cart",
    })

    expect(result).toEqual({ ok: true })
    expect(trackCommunicationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "waitlist_joined",
        properties: expect.objectContaining({
          confirmation_email_sent: false,
          strapi_id: "bis_doc_7",
        }),
      })
    )
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "back_in_stock_capture_failed",
        fingerprint: "back_in_stock:confirmation_email:unknown",
        meta: expect.objectContaining({
          stage: "confirmation_email",
          strapi_id: "bis_doc_7",
          source: "side_cart",
          waitlist_reason: "allocated_out",
          error_message: "Postmark rejected [email]",
        }),
      })
    )
  })
})

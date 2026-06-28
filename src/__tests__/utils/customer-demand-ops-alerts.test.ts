import {
  emitBackInStockCaptureFailureAlert,
  emitWholesaleInquiryFailureAlert,
} from "@lib/customer-demand-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("customer demand ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits redacted wholesale inquiry failure alerts", async () => {
    await emitWholesaleInquiryFailureAlert({
      stage: "postmark_response",
      status: 422,
      statusText: "Unprocessable Entity",
      operationType: "Caterer",
      sourceUrlPresent: true,
      error: "Rejected customer owner@example.com as ReplyTo",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "wholesale_inquiry_send_failed",
        severity: "warn",
        path: "src/app/api/wholesale-inquiry/route.ts",
        source: "storefront-server",
        fingerprint: "wholesale_inquiry:postmark_response:422",
        meta: expect.objectContaining({
          demand_flow: "wholesale_inquiry",
          stage: "postmark_response",
          status: 422,
          status_text: "Unprocessable Entity",
          operation_type: "Caterer",
          source_url_present: true,
          error_message: "Rejected customer [email] as ReplyTo",
        }),
      })
    )
  })

  it("emits back-in-stock capture failure alerts without customer email metadata", async () => {
    await emitBackInStockCaptureFailureAlert({
      stage: "strapi_persist",
      status: 500,
      error: new Error("failed for shopper@example.com"),
      medusaProductId: "prod_123",
      medusaVariantId: "variant_123",
      productHandle: "first-cut-brisket",
      sku: "10-01-01",
      source: "pdp",
      waitlistReason: "out_of_stock",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "back_in_stock_capture_failed",
        severity: "warn",
        path: "src/lib/data/back-in-stock.ts",
        source: "storefront-server",
        fingerprint: "back_in_stock:strapi_persist:500",
        meta: expect.objectContaining({
          demand_flow: "back_in_stock",
          stage: "strapi_persist",
          status: 500,
          medusa_product_id: "prod_123",
          medusa_variant_id: "variant_123",
          product_handle: "first-cut-brisket",
          sku: "10-01-01",
          source: "pdp",
          waitlist_reason: "out_of_stock",
          error_message: "failed for [email]",
        }),
      })
    )
  })
})

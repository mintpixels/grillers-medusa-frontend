import {
  emitCartProductDetailsFailureAlert,
  withCartProductDetailsTimeoutAlert,
} from "@lib/cart-enrichment-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("cart enrichment ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when cart product details cannot be read", async () => {
    await emitCartProductDetailsFailureAlert({
      stage: "strapi_lookup",
      productIds: ["prod_1", "prod_2"],
      error: new Error("Strapi unavailable"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cart_product_details_degraded",
        severity: "warn",
        title: "Cart product details unavailable",
        path: "src/lib/util/cart-product-details.ts",
        fingerprint: "cart_product_details:strapi_lookup",
        meta: expect.objectContaining({
          content_surface: "cart_product_details",
          stage: "strapi_lookup",
          product_count: 2,
          product_id_sample: ["prod_1", "prod_2"],
          timeout_ms: null,
          error_message: "Strapi unavailable",
        }),
      })
    )
  })

  it("emits a timeout alert when cart product details fall back", async () => {
    const result = await withCartProductDetailsTimeoutAlert({
      promise: new Promise<Record<string, unknown>>(() => {}),
      fallback: {},
      productIds: ["prod_1"],
      timeoutMs: 0,
    })

    expect(result).toEqual({})
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cart_product_details_degraded",
        severity: "warn",
        title: "Cart product details timed out",
        fingerprint: "cart_product_details:timeout",
        meta: expect.objectContaining({
          stage: "timeout",
          product_count: 1,
          product_id_sample: ["prod_1"],
          timeout_ms: 0,
        }),
      })
    )
  })
})

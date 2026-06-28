import {
  emitStorefrontApiDataFailureAlert,
  withStorefrontApiFallback,
} from "@lib/storefront-api-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("storefront api ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when a storefront API route falls back after a request failure", async () => {
    await emitStorefrontApiDataFailureAlert({
      route: "side_cart",
      stage: "upsells",
      reason: "request_failed",
      path: "src/app/api/storefront/side-cart/route.ts",
      timeoutMs: 900,
      error: new Error("Strapi unavailable"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "storefront_api_data_degraded",
        severity: "warn",
        title: "Side cart upsells unavailable; using fallback",
        path: "src/app/api/storefront/side-cart/route.ts",
        fingerprint: "storefront_api:side_cart:upsells:request_failed",
        meta: expect.objectContaining({
          api_route: "side_cart",
          stage: "upsells",
          reason: "request_failed",
          timeout_ms: 900,
          error_message: "Strapi unavailable",
        }),
      })
    )
  })

  it("returns the fallback and alerts when a storefront API route times out", async () => {
    const result = await withStorefrontApiFallback({
      promise: new Promise<Record<string, unknown>>(() => {}),
      fallback: {},
      route: "home_personalization",
      stage: "reorder_strapi_map",
      path: "src/app/api/storefront/home-personalization/route.ts",
      timeoutMs: 0,
    })

    expect(result).toEqual({})
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "storefront_api_data_degraded",
        severity: "warn",
        title:
          "Home personalization reorder_strapi_map timed out; using fallback",
        fingerprint:
          "storefront_api:home_personalization:reorder_strapi_map:timeout",
        meta: expect.objectContaining({
          api_route: "home_personalization",
          stage: "reorder_strapi_map",
          reason: "timeout",
          timeout_ms: 0,
          error_message: null,
        }),
      })
    )
  })
})

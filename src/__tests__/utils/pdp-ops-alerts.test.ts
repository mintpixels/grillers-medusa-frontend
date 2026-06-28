/**
 * @jest-environment node
 */

import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import {
  emitPdpStrapiLoadFailureAlert,
  withPdpStrapiFallback,
} from "@lib/pdp-ops-alerts"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("PDP ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a stable warning when PDP Strapi data degrades", async () => {
    await emitPdpStrapiLoadFailureAlert({
      stage: "product_data",
      reason: "request_failed",
      handle: "first-cut-brisket",
      countryCode: "us",
      medusaProductId: "prod_123",
      error: new Error("Strapi 504"),
    })

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "pdp_strapi_data_degraded",
        severity: "warn",
        fingerprint: "pdp_strapi:product_data:request_failed",
        path: "src/app/[countryCode]/(main)/products/[handle]/page.tsx",
        meta: expect.objectContaining({
          catalog_surface: "pdp",
          stage: "product_data",
          reason: "request_failed",
          handle: "first-cut-brisket",
          medusa_product_id: "prod_123",
          error_message: "Error: Strapi 504",
        }),
      })
    )
  })

  it("returns fallback and alerts when a PDP Strapi request rejects", async () => {
    await expect(
      withPdpStrapiFallback(Promise.reject(new Error("GraphQL down")), null, {
        stage: "common_pdp",
        timeoutMs: 100,
        handle: "first-cut-brisket",
        countryCode: "us",
      })
    ).resolves.toBeNull()

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: "pdp_strapi:common_pdp:request_failed",
        meta: expect.objectContaining({
          reason: "request_failed",
          stage: "common_pdp",
        }),
      })
    )
  })

  it("returns fallback and alerts when PDP Strapi data times out", async () => {
    await expect(
      withPdpStrapiFallback(new Promise(() => undefined), [], {
        stage: "ingredient_disclosures",
        timeoutMs: 1,
        handle: "first-cut-brisket",
        countryCode: "us",
        medusaProductId: "prod_123",
      })
    ).resolves.toEqual([])

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: "pdp_strapi:ingredient_disclosures:timeout",
        meta: expect.objectContaining({
          reason: "timeout",
          timeout_ms: 1,
        }),
      })
    )
  })
})

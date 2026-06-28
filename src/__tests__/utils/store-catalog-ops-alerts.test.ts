import {
  emitStoreCatalogEmptyAlert,
  emitStoreCatalogLoadFailureAlert,
} from "@lib/store-catalog-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("store catalog ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when the legacy query recovers the store catalog", async () => {
    await emitStoreCatalogLoadFailureAlert({
      stage: "primary",
      error: new Error("GraphQL 504"),
      timeoutMs: 8000,
      recovered: true,
    })

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "store_catalog_load_degraded",
        severity: "warn",
        fingerprint: "store_catalog:primary:degraded",
        path: "src/lib/data/strapi/collections.ts",
        meta: expect.objectContaining({
          catalog_surface: "store",
          stage: "primary",
          recovered: true,
          timeout_ms: 8000,
          error_message: "Error: GraphQL 504",
        }),
      })
    )
  })

  it("emits a page alert when every store catalog query fails", async () => {
    await emitStoreCatalogLoadFailureAlert({
      stage: "legacy",
      error: new Error("legacy unavailable"),
      primaryError: new Error("primary unavailable"),
      timeoutMs: 8000,
      recovered: false,
    })

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "store_catalog_load_failed",
        severity: "page",
        fingerprint: "store_catalog:all_queries_failed",
        meta: expect.objectContaining({
          stage: "legacy",
          recovered: false,
          primary_error_message: "Error: primary unavailable",
        }),
      })
    )
  })

  it("emits a page alert when the store catalog resolves empty", async () => {
    await emitStoreCatalogEmptyAlert({
      rawCount: 0,
      visibleCount: 0,
    })

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "store_catalog_empty",
        severity: "page",
        fingerprint: "store_catalog:empty",
        path: "src/app/[countryCode]/(main)/store/page.tsx",
        meta: expect.objectContaining({
          catalog_surface: "store",
          raw_product_count: 0,
          visible_product_count: 0,
        }),
      })
    )
  })
})

import {
  emitCuratedCollectionsStrapiFailureAlert,
  withCuratedCollectionsTimeoutAlert,
} from "@lib/curated-collections-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("curated collection ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when a legacy query recovers curated collections", async () => {
    await emitCuratedCollectionsStrapiFailureAlert({
      operation: "list",
      stage: "primary",
      surface: "pdp",
      countryCode: "us",
      customerState: "all",
      limit: 12,
      recovered: true,
      error: new Error("Cannot query field SubstitutionPolicyCopy"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_strapi_degraded",
        severity: "warn",
        title: "Curated collections list recovered with legacy query",
        fingerprint: "curated_collections:list:primary:recovered",
        meta: expect.objectContaining({
          content_surface: "curated_collections",
          operation: "list",
          stage: "primary",
          surface: "pdp",
          recovered: true,
          country_code: "us",
          customer_state: "all",
          limit: 12,
          error_message: "Cannot query field SubstitutionPolicyCopy",
        }),
      })
    )
  })

  it("emits a timeout alert when a curated merchandising surface falls back", async () => {
    const result = await withCuratedCollectionsTimeoutAlert({
      promise: new Promise<string[]>(() => {}),
      fallback: [],
      operation: "cards",
      surface: "homepage",
      countryCode: "us",
      customerState: "guest_or_no_orders",
      limit: 8,
      timeoutMs: 0,
    })

    expect(result).toEqual([])
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "curated_collections_timeout",
        severity: "warn",
        title: "Curated collections cards timed out on homepage",
        fingerprint: "curated_collections:cards:homepage:timeout",
        meta: expect.objectContaining({
          content_surface: "curated_collections",
          operation: "cards",
          surface: "homepage",
          timeout_ms: 0,
          country_code: "us",
          customer_state: "guest_or_no_orders",
          limit: 8,
        }),
      })
    )
  })
})

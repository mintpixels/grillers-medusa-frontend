import {
  emitLayoutDataFailureAlert,
  withLayoutDataFallback,
} from "@lib/layout-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("layout ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when global layout data falls back after a request failure", async () => {
    await emitLayoutDataFailureAlert({
      surface: "header_nav",
      stage: "strapi_header_nav",
      reason: "request_failed",
      path: "src/modules/layout/templates/nav/index.tsx",
      timeoutMs: 1500,
      error: new Error("Strapi unavailable"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "layout_data_degraded",
        severity: "warn",
        title: "Header navigation unavailable; using fallback",
        path: "src/modules/layout/templates/nav/index.tsx",
        fingerprint: "layout_data:header_nav:strapi_header_nav:request_failed",
        meta: expect.objectContaining({
          content_surface: "layout",
          layout_surface: "header_nav",
          stage: "strapi_header_nav",
          reason: "request_failed",
          timeout_ms: 1500,
          error_message: "Strapi unavailable",
        }),
      })
    )
  })

  it("returns the fallback and alerts when layout data times out", async () => {
    const result = await withLayoutDataFallback({
      promise: new Promise<string[]>(() => {}),
      fallback: [],
      surface: "regions",
      stage: "medusa_regions",
      path: "src/modules/layout/templates/nav/index.tsx",
      timeoutMs: 0,
    })

    expect(result).toEqual([])
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "layout_data_degraded",
        severity: "warn",
        title: "Region navigation timed out; using fallback",
        fingerprint: "layout_data:regions:medusa_regions:timeout",
        meta: expect.objectContaining({
          layout_surface: "regions",
          stage: "medusa_regions",
          reason: "timeout",
          timeout_ms: 0,
          error_message: null,
        }),
      })
    )
  })
})

import { emitFallbackHomepageOpsAlert } from "@lib/homepage-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

describe("homepage ops alerts", () => {
  it("emits an ops alert for fallback homepage renders", async () => {
    await emitFallbackHomepageOpsAlert({
      countryCode: "us",
      hasStrapiData: false,
      hasGlobalData: true,
    })

    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "fallback_homepage_rendered",
        path: "src/app/[countryCode]/(main)/page.tsx",
        meta: expect.objectContaining({
          country_code: "us",
          has_strapi_data: false,
          has_global_data: true,
        }),
      })
    )
  })
})

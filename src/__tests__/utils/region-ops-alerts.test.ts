import { sdk } from "@lib/config"
import { getCacheOptions } from "@lib/data/cookies"
import { getRegion } from "@lib/data/regions"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getCacheOptions: jest.fn(),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockSdkFetch = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const mockGetCacheOptions = getCacheOptions as jest.MockedFunction<
  typeof getCacheOptions
>
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("region lookup ops alerts", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetCacheOptions.mockResolvedValue({})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("returns null and alerts when the Medusa region lookup fails", async () => {
    mockSdkFetch.mockRejectedValueOnce(
      new Error("regions unavailable for shopper@example.com")
    )

    await expect(getRegion("zz-alert-test")).resolves.toBeNull()

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "region_lookup_failed",
        severity: "warn",
        fingerprint: "region_lookup_failed:country_region_lookup:transport",
        meta: expect.objectContaining({
          region_surface: "storefront_region_lookup",
          failure_stage: "country_region_lookup",
          route_dependency: "/store/regions",
          country_code: "zz-alert-test",
          error_message: expect.stringContaining("[redacted-email]"),
        }),
      })
    )
    expect(JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls)).not.toContain(
      "shopper@example.com"
    )
  })
})

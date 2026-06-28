import {
  emitNewsletterProxyFailureAlert,
  shouldAlertNewsletterProxyStatus,
} from "@lib/newsletter-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("newsletter ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("alerts on auth and server upstream statuses only", () => {
    expect(shouldAlertNewsletterProxyStatus(400)).toBe(false)
    expect(shouldAlertNewsletterProxyStatus(404)).toBe(false)
    expect(shouldAlertNewsletterProxyStatus(401)).toBe(true)
    expect(shouldAlertNewsletterProxyStatus(403)).toBe(true)
    expect(shouldAlertNewsletterProxyStatus(500)).toBe(true)
  })

  it("emits redacted newsletter proxy failure alerts", async () => {
    await emitNewsletterProxyFailureAlert({
      flow: "subscribe",
      stage: "transport",
      path: "src/app/api/newsletter/subscribe/route.ts",
      error: "service failed for shopper@example.com",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "newsletter_proxy_failed",
        severity: "warn",
        source: "storefront-server",
        fingerprint: "newsletter_proxy:subscribe:transport:unknown",
        meta: expect.objectContaining({
          newsletter_flow: "subscribe",
          stage: "transport",
          error_message: "service failed for [email]",
        }),
      })
    )
  })
})

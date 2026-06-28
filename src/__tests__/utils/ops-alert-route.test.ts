import {
  emitBrowserOpsAlertFromBody,
  isAllowedBrowserOpsAlert,
} from "@lib/ops-alert-route"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const headers = {
  get(name: string) {
    const values: Record<string, string> = {
      referer: "https://shop.example.com/us/cart",
      "user-agent": "jest",
    }
    return values[name.toLowerCase()] || null
  },
}

describe("browser ops alert route helper", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("allows only transient navigation recovery alerts from the browser", () => {
    expect(isAllowedBrowserOpsAlert("transient_navigation_auto_recovery")).toBe(
      true
    )
    expect(isAllowedBrowserOpsAlert("other")).toBe(false)
  })

  it("proxies transient navigation recovery alerts to the server-side emitter", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "transient_navigation_auto_recovery",
        title: "Transient navigation error auto-recovered",
        message: "ChunkLoadError",
        digest: "digest_123",
        url: "https://shop.example.com/us/cart",
      },
      headers
    )

    expect(result).toEqual({ ok: true, status: 202 })
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "transient_navigation_auto_recovery",
        path: "src/app/error.tsx",
        meta: expect.objectContaining({
          digest: "digest_123",
          message: "ChunkLoadError",
          user_agent: "jest",
        }),
      })
    )
  })

  it("proxies sanitized client add-to-cart failures", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "client_add_to_cart_failed",
        title: "Ignored title with raw user text",
        surface: "Algolia Product Card",
        action: "Add To Cart",
        reason: "HTTP 500",
        status_code: 500,
        product_id: "prod_123",
        variant_id: "variant_456",
        product_handle: "brisket-first-cut",
        message: "raw exception text should not be forwarded",
        url: "https://shop.example.com/us/store",
      },
      headers
    )

    expect(result).toEqual({ ok: true, status: 202 })
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "client_add_to_cart_failed",
        title: "Storefront client add-to-cart failed",
        path: "browser:add-to-cart",
        source: "storefront-browser",
        meta: expect.objectContaining({
          surface: "algolia_product_card",
          action: "add_to_cart",
          reason: "http_500",
          status_code: 500,
          product_id: "prod_123",
          variant_id: "variant_456",
          product_handle: "brisket-first-cut",
        }),
      })
    )
    expect((emitStorefrontOpsAlert as jest.Mock).mock.calls[0][0].meta).not.toHaveProperty(
      "message"
    )
  })

  it("rejects unknown browser alert kinds", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      { alert_kind: "other" },
      headers
    )

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "invalid_alert_kind",
    })
    expect(emitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})

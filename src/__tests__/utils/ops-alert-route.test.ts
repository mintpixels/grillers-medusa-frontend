import {
  checkRateLimit,
  emitBrowserOpsAlertFromBody,
  isAllowedBrowserOpsAlert,
  resolveAlertSeverity,
} from "@lib/ops-alert-route"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
  buildOpsAlertFingerprint: jest.fn(() => "deadbeef"),
}))

function makeHeaders(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    referer: "https://shop.example.com/us/cart",
    "user-agent": "jest",
    "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`,
    ...overrides,
  }
  return {
    get(name: string) {
      return values[name.toLowerCase()] ?? null
    },
  }
}

describe("browser ops alert allow-map", () => {
  it("allows only mapped alert kinds", () => {
    expect(isAllowedBrowserOpsAlert("transient_navigation_auto_recovery")).toBe(
      true
    )
    expect(isAllowedBrowserOpsAlert("checkout_segment_error")).toBe(true)
    expect(isAllowedBrowserOpsAlert("route_segment_error")).toBe(true)
    expect(isAllowedBrowserOpsAlert("client_unhandled_error")).toBe(true)
    expect(isAllowedBrowserOpsAlert("client_unhandledrejection")).toBe(true)
    expect(isAllowedBrowserOpsAlert("client_add_to_cart_failed")).toBe(true)
    expect(isAllowedBrowserOpsAlert("client_analytics_delivery_failed")).toBe(
      true
    )
    expect(isAllowedBrowserOpsAlert("client_cart_mutation_failed")).toBe(true)
    expect(isAllowedBrowserOpsAlert("client_profile_action_failed")).toBe(true)
    expect(isAllowedBrowserOpsAlert("client_search_provider_failed")).toBe(true)
    expect(isAllowedBrowserOpsAlert("staff_module_load_failed")).toBe(true)
    expect(isAllowedBrowserOpsAlert("revenue_action_slow")).toBe(true)
    expect(isAllowedBrowserOpsAlert("other")).toBe(false)
    expect(isAllowedBrowserOpsAlert("")).toBe(false)
  })
})

describe("severity clamping", () => {
  it("clamps a requested page down to the kind's ceiling (anti-abuse)", () => {
    // route_segment_error ceiling is warn — an anon client cannot mint page.
    expect(resolveAlertSeverity("route_segment_error", "page")).toBe("warn")
    expect(resolveAlertSeverity("client_unhandled_error", "page")).toBe("warn")
    expect(resolveAlertSeverity("client_search_provider_failed", "page")).toBe(
      "warn"
    )
    expect(
      resolveAlertSeverity("client_analytics_delivery_failed", "page")
    ).toBe("warn")
    expect(resolveAlertSeverity("staff_module_load_failed", "page")).toBe(
      "warn"
    )
    expect(resolveAlertSeverity("revenue_action_slow", "page")).toBe("warn")
    expect(
      resolveAlertSeverity("transient_navigation_auto_recovery", "page")
    ).toBe("info")
  })

  it("allows page only for the dedicated checkout kind", () => {
    expect(resolveAlertSeverity("checkout_segment_error", "page")).toBe("page")
  })

  it("permits requesting below the ceiling", () => {
    expect(resolveAlertSeverity("checkout_segment_error", "warn")).toBe("warn")
    expect(resolveAlertSeverity("route_segment_error", "info")).toBe("info")
  })

  it("defaults to the ceiling for missing/garbage severity", () => {
    expect(resolveAlertSeverity("route_segment_error", undefined)).toBe("warn")
    expect(resolveAlertSeverity("checkout_segment_error", "lol")).toBe("page")
  })
})

describe("rate limit", () => {
  it("eventually returns false within a burst for a single key", () => {
    const key = `rate-test-${Date.now()}`
    let allowed = 0
    let blocked = false
    for (let i = 0; i < 60; i += 1) {
      if (checkRateLimit(key, 1_000_000)) {
        allowed += 1
      } else {
        blocked = true
        break
      }
    }
    expect(allowed).toBeGreaterThan(0)
    expect(blocked).toBe(true)
  })
})

describe("emitBrowserOpsAlertFromBody", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("proxies a checkout segment error and preserves page severity", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "checkout_segment_error",
        severity: "page",
        title: "Checkout failed to load",
        message: "TypeError: x is undefined",
        digest: "digest_123",
        url: "https://shop.example.com/us/checkout",
      },
      makeHeaders()
    )

    expect(result).toEqual({ ok: true, status: 202 })
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_segment_error",
        severity: "page",
        source: "client",
        meta: expect.objectContaining({
          digest: "digest_123",
          message: "TypeError: x is undefined",
          user_agent: "jest",
        }),
      })
    )
  })

  it("clamps a route_segment_error page request to warn", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "route_segment_error",
        severity: "page",
        title: "Route blew up",
      },
      makeHeaders()
    )

    expect(result).toEqual({ ok: true, status: 202 })
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "route_segment_error",
        severity: "warn",
      })
    )
  })

  it("accepts handled staff and revenue-path alerts with sanitized metadata", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "revenue_action_slow",
        severity: "page",
        title: "Collection add took 6200ms",
        message: "Collection add took 6200ms for 13 SKUs.",
        extra: {
          action: "add_collection_to_cart",
          collection_slug: "deli\nsampler",
          sku_count: 13,
          duration_ms: 6200,
          nested: { ignored: true },
        },
      },
      makeHeaders()
    )

    expect(result).toEqual({ ok: true, status: 202 })
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "revenue_action_slow",
        severity: "warn",
        meta: expect.objectContaining({
          action: "add_collection_to_cart",
          collection_slug: "deli sampler",
          sku_count: 13,
          duration_ms: 6200,
          message: "Collection add took 6200ms for 13 SKUs.",
          user_agent: "jest",
        }),
      })
    )
    const call = (emitStorefrontOpsAlert as jest.Mock).mock.calls[0][0]
    expect(call.meta.nested).toBeUndefined()
  })

  it("accepts sanitized client add-to-cart failures", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "client_add_to_cart_failed",
        severity: "page",
        title: "Storefront client add-to-cart failed",
        path: "browser:product_card:add_to_cart",
        message: "raw exception text should be ignored",
        extra: {
          surface: "product_card",
          action: "add_to_cart",
          reason: "client_exception",
          product_id: "prod_123",
          variant_id: "variant_456",
          product_handle: "brisket-first-cut",
        },
      },
      makeHeaders()
    )

    expect(result).toEqual({ ok: true, status: 202 })
    expect(emitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "client_add_to_cart_failed",
        severity: "warn",
        path: "browser:product_card:add_to_cart",
        source: "client",
        meta: expect.objectContaining({
          surface: "product_card",
          action: "add_to_cart",
          reason: "client_exception",
          product_id: "prod_123",
          variant_id: "variant_456",
          product_handle: "brisket-first-cut",
        }),
      })
    )
  })

  it("rejects unknown alert kinds with 400", async () => {
    const result = await emitBrowserOpsAlertFromBody(
      { alert_kind: "other" },
      makeHeaders()
    )
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "invalid_alert_kind",
    })
    expect(emitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("returns 429 once the per-IP+kind bucket is drained", async () => {
    const headers = makeHeaders({ "x-forwarded-for": "203.0.113.7" })
    let saw429 = false
    for (let i = 0; i < 60; i += 1) {
      const result = await emitBrowserOpsAlertFromBody(
        {
          alert_kind: "client_unhandled_error",
          title: "boom",
        },
        headers
      )
      if (result.status === 429) {
        saw429 = true
        break
      }
    }
    expect(saw429).toBe(true)
  })

  it("caps overly long titles/messages and strips control chars", async () => {
    const longTitle = "A".repeat(900) + String.fromCharCode(7, 0) + "end"
    await emitBrowserOpsAlertFromBody(
      {
        alert_kind: "client_unhandledrejection",
        title: longTitle,
        message: "line1\nline2" + String.fromCharCode(1),
      },
      makeHeaders()
    )
    const call = (emitStorefrontOpsAlert as jest.Mock).mock.calls[0][0]
    expect(call.title.length).toBeLessThanOrEqual(500)
    const controlChars = new RegExp("[\\x00-\\x1F\\x7F]")
    expect(call.title).not.toMatch(controlChars)
    expect(call.meta.message).not.toMatch(controlChars)
  })
})

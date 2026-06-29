import {
  classifyClientError,
  reportClientOpsAlert,
} from "@lib/client-ops-alert"

describe("client ops alerts", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("classifies coarse browser error reasons", () => {
    expect(classifyClientError({ status: 503 })).toBe("http_503")
    expect(classifyClientError({ name: "AbortError" })).toBe("aborted")
    expect(classifyClientError({ message: "Failed to fetch" })).toBe(
      "network_error"
    )
  })

  it("posts sanitized browser alert payloads", () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock as any

    reportClientOpsAlert({
      alertKind: "client_add_to_cart_failed",
      title: "Storefront client add-to-cart failed",
      surface: "Product Card!!",
      action: "Add To Cart",
      error: new Error("Raw customer-visible error text"),
      target: "GP Analytics",
      eventName: "product added to cart",
      productId: "prod_123",
      variantId: "variant_456",
      productHandle: "brisket-first-cut",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ops-alert",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      })
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({
      alert_kind: "client_add_to_cart_failed",
      severity: "warn",
      path: "browser:product_card:add_to_cart",
      extra: {
        surface: "product_card",
        action: "add_to_cart",
        reason: "client_exception",
        target: "gp_analytics",
        event_name: "product_added_to_cart",
        product_id: "prod_123",
        variant_id: "variant_456",
        product_handle: "brisket-first-cut",
      },
    })
    expect(JSON.stringify(body)).not.toContain("Raw customer-visible")
  })
})

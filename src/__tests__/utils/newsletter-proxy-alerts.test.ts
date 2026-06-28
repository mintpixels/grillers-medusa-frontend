import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

jest.mock("@lib/data/customer", () => ({
  retrieveCustomer: jest.fn(async () => ({ email: "shopper@example.com" })),
}))

const nodeFetch = require("node-fetch") as any
const HeadersPolyfill = nodeFetch.Headers
const RequestPolyfill = nodeFetch.Request
const ResponsePolyfill = nodeFetch.Response

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

let subscribePost: any
let requestLinkPost: any
let lookupGet: any

function request(url: string, init: RequestInit = {}) {
  return new RequestPolyfill(url, init) as any
}

function responseJson(body: unknown, init: ResponseInit = {}) {
  const headers = new HeadersPolyfill(init.headers || {})
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }
  return new ResponsePolyfill(JSON.stringify(body), {
    ...init,
    headers,
  })
}

describe("newsletter proxy alerting", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  const originalHeaders = global.Headers
  const originalRequest = global.Request
  const originalResponse = global.Response

  beforeAll(async () => {
    global.Headers = HeadersPolyfill as any
    global.Request = RequestPolyfill as any
    ;(ResponsePolyfill as any).json = responseJson
    global.Response = ResponsePolyfill as any
    ;({ POST: subscribePost } = await import(
      "../../app/api/newsletter/subscribe/route"
    ))
    ;({ POST: requestLinkPost } = await import(
      "../../app/api/newsletter/request-link/route"
    ))
    ;({ GET: lookupGet } = await import(
      "../../app/api/newsletter/lookup/route"
    ))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEWSLETTER_SERVICE_URL: "https://newsletter.example.com",
      NEWSLETTER_API_KEY: "newsletter-key",
    }
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  afterAll(() => {
    process.env = originalEnv
    global.Headers = originalHeaders
    global.Request = originalRequest
    global.Response = originalResponse
  })

  it("alerts on hidden request-link proxy misconfiguration while preserving 202", async () => {
    delete process.env.NEWSLETTER_SERVICE_URL

    const response = await requestLinkPost(
      request("https://www.grillerspride.com/api/newsletter/request-link", {
        method: "POST",
        body: JSON.stringify({ email: "shopper@example.com" }),
      })
    )

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "newsletter_proxy_failed",
        path: "src/app/api/newsletter/request-link/route.ts",
        meta: expect.objectContaining({
          newsletter_flow: "request_preferences_link",
          stage: "configuration",
          missing_env: ["NEWSLETTER_SERVICE_URL"],
        }),
      })
    )
  })

  it("alerts on subscribe upstream server errors while preserving response status", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ error: "service_down" }),
    }) as any

    const response = await subscribePost(
      request("https://www.grillerspride.com/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "shopper@example.com" }),
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "service_down" })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "newsletter_proxy_failed",
        path: "src/app/api/newsletter/subscribe/route.ts",
        meta: expect.objectContaining({
          newsletter_flow: "subscribe",
          stage: "upstream_response",
          status: 500,
        }),
      })
    )
  })

  it("alerts on hidden lookup transport failures while preserving subscriber-null response", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("newsletter timeout for shopper@example.com")) as any

    const response = await lookupGet(
      request("https://www.grillerspride.com/api/newsletter/lookup")
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ subscriber: null })
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "newsletter_proxy_failed",
        path: "src/app/api/newsletter/lookup/route.ts",
        meta: expect.objectContaining({
          newsletter_flow: "lookup",
          stage: "transport",
          error_message: "newsletter timeout for [email]",
        }),
      })
    )
  })
})

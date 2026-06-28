import { createHmac } from "crypto"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const nodeFetch = require("node-fetch") as any
const HeadersPolyfill = nodeFetch.Headers
const RequestPolyfill = nodeFetch.Request
const ResponsePolyfill = nodeFetch.Response

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

let backInStockUnsubscribeGet: (req: Request) => Promise<Response>
let emailUnsubscribeGet: (req: Request) => Promise<Response>

function request(url: string) {
  return new RequestPolyfill(url, { method: "GET" }) as any
}

function signedReviewUnsubscribeUrl(email: string) {
  const type = "reviews"
  const userBlob = Buffer.from(email).toString("base64url")
  const sig = createHmac("sha256", "unsubscribe-secret")
    .update(`${type}:${email.toLowerCase()}`)
    .digest("base64url")
  return `https://www.grillerspride.com/api/unsubscribe?type=${type}&u=${userBlob}&s=${sig}`
}

describe("unsubscribe alerting", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  const originalHeaders = global.Headers
  const originalRequest = global.Request
  const originalResponse = global.Response

  beforeAll(async () => {
    global.Headers = HeadersPolyfill as any
    global.Request = RequestPolyfill as any
    global.Response = ResponsePolyfill as any
    process.env = {
      ...originalEnv,
      STRAPI_ENDPOINT: "https://strapi.example.com",
      STRAPI_API_TOKEN: "strapi-token",
      UNSUBSCRIBE_SECRET: "unsubscribe-secret",
    }
    ;({ GET: backInStockUnsubscribeGet } = await import(
      "../../app/api/back-in-stock/unsubscribe/route"
    ))
    ;({ GET: emailUnsubscribeGet } = await import(
      "../../app/api/unsubscribe/route"
    ))
  })

  beforeEach(() => {
    jest.clearAllMocks()
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

  it("alerts when a back-in-stock unsubscribe update is rejected", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              documentId: "bis_doc_1",
              ProductTitle: "First Cut Brisket",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      }) as any

    const response = await backInStockUnsubscribeGet(
      request("https://www.grillerspride.com/api/back-in-stock/unsubscribe?t=token")
    )

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toContain(
      "Couldn't process your request"
    )
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "customer_consent_update_failed",
        path: "src/app/api/back-in-stock/unsubscribe/route.ts",
        meta: expect.objectContaining({
          consent_flow: "back_in_stock_unsubscribe",
          stage: "strapi_update",
          status: 503,
          strapi_id: "bis_doc_1",
        }),
      })
    )
  })

  it("alerts and renders failure when a signed email suppression cannot be recorded", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    }) as any

    const response = await emailUnsubscribeGet(
      request(signedReviewUnsubscribeUrl("shopper@example.com"))
    )

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toContain(
      "Couldn't process your request"
    )
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "customer_consent_update_failed",
        path: "src/app/api/unsubscribe/route.ts",
        meta: expect.objectContaining({
          consent_flow: "email_unsubscribe",
          stage: "strapi_record",
          status: 500,
          type: "reviews",
        }),
      })
    )
  })
})

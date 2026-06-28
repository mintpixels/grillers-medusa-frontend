/**
 * @jest-environment node
 */

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

let cronPost: (req: Request) => Promise<Response>

function request() {
  return new RequestPolyfill(
    "https://www.grillerspride.com/api/cron/review-acquisition",
    {
      method: "POST",
      headers: { authorization: "Bearer cron-secret" },
    }
  ) as any
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

describe("review acquisition cron alerting", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  const originalHeaders = global.Headers
  const originalRequest = global.Request
  const originalResponse = global.Response
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(async () => {
    global.Headers = HeadersPolyfill as any
    global.Request = RequestPolyfill as any
    ;(ResponsePolyfill as any).json = responseJson
    global.Response = ResponsePolyfill as any
    process.env = {
      ...originalEnv,
      CRON_SECRET: "cron-secret",
      MEDUSA_BACKEND_URL: "https://medusa.example.com",
      MEDUSA_ADMIN_API_TOKEN: "admin-token",
      STRAPI_ENDPOINT: "https://strapi.example.com",
      STRAPI_API_TOKEN: "strapi-token",
    }
    ;({ POST: cronPost } = await import(
      "../../app/api/cron/review-acquisition/route"
    ))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    global.fetch = originalFetch
  })

  afterAll(() => {
    process.env = originalEnv
    global.Headers = originalHeaders
    global.Request = originalRequest
    global.Response = originalResponse
  })

  it("pages when the delivered-order Medusa source returns non-2xx while preserving cron 200", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
    })) as any

    const response = await cronPost(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        scanned: 0,
        sourceFailed: true,
        sourceFailureStage: "medusa_status",
        sourceStatus: 503,
      })
    )
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cron_review_acquisition_source_failed",
        severity: "page",
        path: "src/app/api/cron/review-acquisition/route.ts",
        source: "storefront-cron",
        meta: expect.objectContaining({
          cron: "review-acquisition",
          failure_stage: "medusa_status",
          source_status: 503,
          scanned: 0,
        }),
      })
    )
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "cron_heartbeat",
        meta: expect.objectContaining({
          cron: "review-acquisition",
          source_failed: true,
          source_failure_stage: "medusa_status",
        }),
      })
    )
  })
})

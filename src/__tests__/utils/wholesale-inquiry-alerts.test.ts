import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import type { POST as PostHandler } from "../../app/api/wholesale-inquiry/route"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const nodeFetch = require("node-fetch") as any
const fetchPolyfill = nodeFetch.default || nodeFetch
const HeadersPolyfill = nodeFetch.Headers
const RequestPolyfill = nodeFetch.Request
const ResponsePolyfill = nodeFetch.Response

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

let POST: typeof PostHandler

const JsonResponsePolyfill = ResponsePolyfill as any
JsonResponsePolyfill.json = (data: unknown, init?: any) => {
  const headers = new HeadersPolyfill(init?.headers)
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }
  return new ResponsePolyfill(JSON.stringify(data), {
    ...init,
    headers,
  })
}

function request(body: Record<string, unknown>) {
  return new RequestPolyfill(
    "https://www.grillerspride.com/api/wholesale-inquiry",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  ) as any
}

describe("wholesale inquiry alerting", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  const originalHeaders = global.Headers
  const originalRequest = global.Request
  const originalResponse = global.Response
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(async () => {
    global.Headers = HeadersPolyfill as any
    global.Request = RequestPolyfill as any
    global.Response = JsonResponsePolyfill as any
    global.fetch = fetchPolyfill as any
    ;({ POST } = await import("../../app/api/wholesale-inquiry/route"))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = fetchPolyfill as any
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined)
    process.env = {
      ...originalEnv,
      POSTMARK_API_TOKEN: "postmark-token",
      POSTMARK_FROM: "sales@grillerspride.com",
      WHOLESALE_INQUIRY_TO: "peter@grillerspride.com",
    }
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env = originalEnv
    global.fetch = originalFetch
  })

  afterAll(() => {
    global.Headers = originalHeaders
    global.Request = originalRequest
    global.Response = originalResponse
  })

  it("alerts when Postmark rejects a valid inquiry", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      text: async () => "ReplyTo buyer@example.com rejected",
    })) as any

    const response = await POST(
      request({
        name: "Buyer",
        email: "buyer@example.com",
        organization: "Kitchen",
        operationType: "Caterer",
        sourceUrl: "https://www.grillerspride.com/us/wholesale",
      })
    )

    expect(response.status).toBe(502)
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "wholesale_inquiry_send_failed",
        path: "src/app/api/wholesale-inquiry/route.ts",
        meta: expect.objectContaining({
          stage: "postmark_response",
          status: 422,
          operation_type: "Caterer",
          source_url_present: true,
          error_message: "ReplyTo [email] rejected",
        }),
      })
    )
  })

  it("alerts when the endpoint is not configured", async () => {
    process.env = {
      ...process.env,
      POSTMARK_API_TOKEN: "",
      POSTMARK_FROM: "",
      WHOLESALE_INQUIRY_TO: "",
    }
    global.fetch = jest.fn() as any

    const response = await POST(
      request({
        name: "Buyer",
        email: "buyer@example.com",
        organization: "Kitchen",
        operationType: "Caterer",
      })
    )

    expect(response.status).toBe(503)
    expect(global.fetch).not.toHaveBeenCalled()
    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "wholesale_inquiry_send_failed",
        meta: expect.objectContaining({
          stage: "configuration",
          missing_env: [
            "POSTMARK_API_TOKEN",
            "POSTMARK_FROM",
            "WHOLESALE_INQUIRY_TO",
          ],
        }),
      })
    )
  })
})

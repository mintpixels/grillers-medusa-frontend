import { createHmac } from "crypto"

type OpsAlertInput = Record<string, unknown> & {
  meta: Record<string, unknown>
}

const mockEmitStorefrontOpsAlert = jest.fn(
  async (_alert: OpsAlertInput) => ({ ok: true, skipped: false }) as const
)

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL, status = 307) => ({
      status,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "location" ? url.toString() : null,
      },
    }),
  },
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: mockEmitStorefrontOpsAlert,
}))

const originalEnv = process.env

function encodedDestination(
  destination = "https://search.google.com/local/writereview?placeid=abc"
) {
  return Buffer.from(destination, "utf8").toString("base64url")
}

function signature(input: {
  secret: string
  platform: string
  orderId: string
  destination: string
}) {
  return createHmac("sha256", input.secret)
    .update(`${input.platform}:${input.orderId}:${input.destination}`)
    .digest("base64url")
}

async function loadRoute(env: Record<string, string | undefined>) {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    REVIEW_CLICK_SECRET: "",
    UNSUBSCRIBE_SECRET: "",
    CRON_SECRET: "",
    ...env,
  }

  return import("../../app/api/review-click/route")
}

function requestUrl(params: Record<string, string>) {
  const url = new URL("https://www.grillerspride.com/api/review-click")
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function request(url: string) {
  return { url } as Request
}

describe("review click alerting", () => {
  afterEach(() => {
    process.env = originalEnv
    jest.clearAllMocks()
  })

  it("pages when a complete review-click link is received without a secret", async () => {
    const d = encodedDestination()
    const { GET } = await loadRoute({})

    const response = await GET(
      request(
        requestUrl({
          platform: "google",
          order: "order_123",
          d,
          s: "signed-link",
        })
      )
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe(
      "https://www.grillerspride.com/us"
    )
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "review_click_tracking_failed",
        severity: "page",
        path: "src/app/api/review-click/route.ts",
        meta: expect.objectContaining({
          reason: "missing_secret",
          platform: "google",
          destination_host: "search.google.com",
          has_signature: true,
        }),
      })
    )
    const meta = mockEmitStorefrontOpsAlert.mock.calls[0][0].meta as Record<
      string,
      unknown
    >
    expect(meta.order_hash).toMatch(/^[a-f0-9]{16}$/)
    expect(JSON.stringify(meta)).not.toContain("order_123")
  })

  it("warns when a generated-looking link has an invalid destination", async () => {
    const d = encodedDestination("https://evil.example.com/review")
    const { GET } = await loadRoute({ REVIEW_CLICK_SECRET: "review-secret" })

    await GET(
      request(
        requestUrl({
          platform: "google",
          order: "order_123",
          d,
          s: signature({
            secret: "review-secret",
            platform: "google",
            orderId: "order_123",
            destination: d,
          }),
        })
      )
    )

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "review_click_tracking_failed",
        severity: "warn",
        meta: expect.objectContaining({
          reason: "invalid_destination",
          destination_host: "evil.example.com",
        }),
      })
    )
  })

  it("warns when the signature does not match", async () => {
    const d = encodedDestination()
    const { GET } = await loadRoute({ REVIEW_CLICK_SECRET: "review-secret" })

    await GET(
      request(
        requestUrl({
          platform: "google",
          order: "order_123",
          d,
          s: "wrong-signature",
        })
      )
    )

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "review_click_tracking_failed",
        severity: "warn",
        meta: expect.objectContaining({
          reason: "signature_mismatch",
          destination_host: "search.google.com",
        }),
      })
    )
  })

  it("does not alert on incomplete probes", async () => {
    const { GET } = await loadRoute({ REVIEW_CLICK_SECRET: "review-secret" })

    await GET(
      request(
        requestUrl({
          platform: "google",
          order: "order_123",
        })
      )
    )

    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})

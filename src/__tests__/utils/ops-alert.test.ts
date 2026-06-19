import {
  buildOpsAlertFingerprint,
  emitStorefrontOpsAlert,
} from "@lib/ops-alert"

describe("emitStorefrontOpsAlert", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("skips without gp-analytics endpoint/key", async () => {
    process.env = {
      ...originalEnv,
      GP_ANALYTICS_ENDPOINT: "",
      GP_ANALYTICS_SERVER_KEY: "",
      NEXT_PUBLIC_GP_ANALYTICS_ENDPOINT: "",
      NEXT_PUBLIC_GP_ANALYTICS_CLIENT_KEY: "",
    }
    const fetchMock = jest.fn()
    global.fetch = fetchMock as any

    const result = await emitStorefrontOpsAlert({
      alertKind: "unit_test",
      title: "Unit test",
      path: "src/lib/ops-alert.ts",
    })

    expect(result).toEqual({ ok: false, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("sends ops_alert events to the gp-analytics ingestion /v1/track", async () => {
    process.env = {
      ...originalEnv,
      GP_ANALYTICS_ENDPOINT: "https://ingest.example.com/",
      GP_ANALYTICS_SERVER_KEY: "server-key",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_RELEASE_SHA: "abc1234",
    }
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock as any

    const result = await emitStorefrontOpsAlert({
      alertKind: "data_fetch_soft_fail",
      title: "retrieveCart failed",
      path: "src/lib/data/cart.ts:retrieveCart",
      severity: "warn",
      meta: { cart_id: "cart_123" },
    })

    expect(result).toEqual({ ok: true, skipped: false })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ingest.example.com/v1/track",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer server-key",
        }),
      })
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.event).toBe("ops_alert")
    expect(body.properties).toMatchObject({
      alert_kind: "data_fetch_soft_fail",
      severity: "warn",
      path: "src/lib/data/cart.ts:retrieveCart",
      title: "retrieveCart failed",
      cart_id: "cart_123",
      release: "abc1234",
      env: "production",
    })
    expect(typeof body.properties.fingerprint).toBe("string")
    expect(body.properties.fingerprint.length).toBeGreaterThan(0)
  })

  it("falls back to the public client endpoint/key", async () => {
    process.env = {
      ...originalEnv,
      GP_ANALYTICS_ENDPOINT: "",
      GP_ANALYTICS_SERVER_KEY: "",
      NEXT_PUBLIC_GP_ANALYTICS_ENDPOINT: "https://ingest.example.com",
      NEXT_PUBLIC_GP_ANALYTICS_CLIENT_KEY: "client-key",
    }
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock as any

    await emitStorefrontOpsAlert({
      alertKind: "unit_test",
      title: "Unit test",
      path: "src/lib/ops-alert.ts",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://ingest.example.com/v1/track",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer client-key",
        }),
      })
    )
  })
})

describe("buildOpsAlertFingerprint", () => {
  it("collapses ids/digits so the same error class shares a fingerprint", () => {
    // Two distinct hex-ish ids and two distinct bare-digit order numbers
    // should normalize to the same fingerprint.
    const a = buildOpsAlertFingerprint(
      "client",
      "checkout_segment_error",
      "Failed to load cart abc123def456 order 1001"
    )
    const b = buildOpsAlertFingerprint(
      "client",
      "checkout_segment_error",
      "Failed to load cart fed654cba321 order 2002"
    )
    expect(a).toBe(b)
  })

  it("differs by source and kind", () => {
    const base = buildOpsAlertFingerprint("client", "kind_a", "same title")
    expect(base).not.toBe(
      buildOpsAlertFingerprint("medusa-server", "kind_a", "same title")
    )
    expect(base).not.toBe(
      buildOpsAlertFingerprint("client", "kind_b", "same title")
    )
  })
})

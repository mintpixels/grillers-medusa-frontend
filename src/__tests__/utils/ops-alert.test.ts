import { emitStorefrontOpsAlert } from "@lib/ops-alert"

describe("emitStorefrontOpsAlert", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("skips without server-side alert sink secrets", async () => {
    process.env = {
      ...originalEnv,
      GP_ANALYTICS_ENDPOINT: "",
      GP_ANALYTICS_SERVER_KEY: "",
      JITSU_HOST: "",
      JITSU_SERVER_SECRET: "",
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

  it("prefers ops_alert payloads to the gp analytics endpoint", async () => {
    process.env = {
      ...originalEnv,
      GP_ANALYTICS_ENDPOINT: "https://analytics.example.com/",
      GP_ANALYTICS_SERVER_KEY: "server-key",
      JITSU_HOST: "https://jitsu.example.com/",
      JITSU_SERVER_SECRET: "secret",
    }
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock as any

    const result = await emitStorefrontOpsAlert({
      alertKind: "unit_test",
      title: "Unit test cart_123",
      path: "src/lib/ops-alert.ts",
      severity: "page",
      meta: { cart_id: "cart_123" },
    })

    expect(result).toEqual({ ok: true, skipped: false })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://analytics.example.com/v1/track",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer server-key",
        }),
      })
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.event).toBe("ops_alert")
    expect(body.experience_version).toBe("storefront")
    expect(body.properties).toMatchObject({
      alert_kind: "unit_test",
      severity: "page",
      path: "src/lib/ops-alert.ts",
      cart_id: "cart_123",
    })
    expect(body.properties.fingerprint).toMatch(/^[a-f0-9]{40}$/)
  })

  it("falls back to classic s2s when gp analytics is not configured", async () => {
    process.env = {
      ...originalEnv,
      GP_ANALYTICS_ENDPOINT: "",
      GP_ANALYTICS_SERVER_KEY: "",
      JITSU_HOST: "https://jitsu.example.com/",
      JITSU_SERVER_SECRET: "secret",
    }
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock as any

    const result = await emitStorefrontOpsAlert({
      alertKind: "unit_test",
      title: "Unit test",
      path: "src/lib/ops-alert.ts",
      meta: { cart_id: "cart_123" },
    })

    expect(result).toEqual({ ok: true, skipped: false })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://jitsu.example.com/api/v1/s2s/event",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Auth-Token": "secret",
        }),
      })
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.event_type).toBe("ops.alert")
    expect(body.eventn_ctx.meta).toMatchObject({
      alert_kind: "unit_test",
      severity: "warn",
      path: "src/lib/ops-alert.ts",
      cart_id: "cart_123",
    })
    expect(body.eventn_ctx.meta.fingerprint).toMatch(/^[a-f0-9]{40}$/)
  })
})

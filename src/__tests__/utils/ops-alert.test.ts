import { emitStorefrontOpsAlert } from "@lib/ops-alert"

describe("emitStorefrontOpsAlert", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it("skips without server-side Jitsu secrets", async () => {
    process.env = { ...originalEnv, JITSU_HOST: "", JITSU_SERVER_SECRET: "" }
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

  it("sends ops.alert payloads to the classic s2s endpoint", async () => {
    process.env = {
      ...originalEnv,
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
      path: "src/lib/ops-alert.ts",
      cart_id: "cart_123",
    })
  })
})

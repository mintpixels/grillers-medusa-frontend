import { jitsuTrack, setJitsuExperimentContext } from "@lib/jitsu"

describe("jitsu first-party communications ingestion", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_JITSU_HOST = ""
    process.env.NEXT_PUBLIC_JITSU_WRITE_KEY = ""
    process.env.NEXT_PUBLIC_COMMUNICATIONS_INGESTION_URL =
      "https://medusa.example.com/"
    process.env.NEXT_PUBLIC_COMMUNICATIONS_API_KEY = "public-ingestion-key"
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any
  })

  afterEach(() => {
    setJitsuExperimentContext({})
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  it("dual-writes storefront events to the communications ingestion API", () => {
    jitsuTrack("product_viewed", {
      product_id: "prod_123",
      customer_type: "dtc",
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      "https://medusa.example.com/api/track",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-api-key": "public-ingestion-key",
        }),
      })
    )

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.event_type).toBe("product_viewed")
    expect(body.eventn_ctx.product_id).toBe("prod_123")
    expect(body.eventn_ctx.customer_type).toBe("dtc")
    expect(body.eventn_ctx.anonymous_id).toBeTruthy()
    expect(body.eventn_ctx.session_id).toBeTruthy()
  })

  it("includes experiment assignment context in communications events", () => {
    setJitsuExperimentContext({
      checkout_shipping_cards: {
        variant: "compact",
        assignment_id: "assign_123",
      },
    })

    jitsuTrack("checkout_started", {
      cart_id: "cart_123",
    })

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(init.body)

    expect(body.event_type).toBe("checkout_started")
    expect(body.eventn_ctx.cart_id).toBe("cart_123")
    expect(body.eventn_ctx.experiment_context).toEqual({
      checkout_shipping_cards: {
        variant: "compact",
        assignment_id: "assign_123",
      },
    })
  })
})

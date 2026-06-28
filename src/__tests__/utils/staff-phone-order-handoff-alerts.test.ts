import { GET } from "../../app/api/staff/phone-order/handoff/route"
import { sdk } from "@lib/config"
import { verifyStaffCartHandoff } from "@lib/data/staff/order-token"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      headers: new Headers(init?.headers),
      json: async () => body,
    }),
    redirect: (url: URL) => ({
      status: 307,
      headers: new Headers({ Location: url.toString() }),
      cookies: { set: jest.fn() },
    }),
  },
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/data/staff/order-token", () => ({
  verifyStaffCartHandoff: jest.fn(),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockSdkFetch = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const mockVerifyStaffCartHandoff =
  verifyStaffCartHandoff as jest.MockedFunction<typeof verifyStaffCartHandoff>
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

function request(url = "https://example.test/api/staff/phone-order/handoff?token=t") {
  return {
    nextUrl: new URL(url),
    url,
  } as any
}

describe("staff phone-order handoff ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyStaffCartHandoff.mockReturnValue({
      cartId: "cart_staff_handoff",
      countryCode: "us",
      staffCustomerId: "cus_staff",
      targetCustomerEmail: "customer@example.com",
      expiresAt: Date.now() + 60_000,
    })
  })

  it("alerts when a valid staff handoff link cannot read its cart", async () => {
    mockSdkFetch.mockRejectedValueOnce(new Error("Medusa cart API timed out"))

    const response = await GET(request())
    const body = await response.json()

    expect(response.status).toBe(410)
    expect(body.error).toBe(
      "This staff checkout link no longer maps to an active cart."
    )
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_handoff_cart_lookup_failed",
        severity: "warn",
        title: "Staff checkout handoff cart lookup failed",
        path: "src/app/api/staff/phone-order/handoff/route.ts",
        source: "medusa-server",
        fingerprint: "staff_handoff:cart_lookup_failed",
        meta: expect.objectContaining({
          staff_module: "phone_order",
          cart_id: "cart_staff_handoff",
          error_message: "Medusa cart API timed out",
        }),
      })
    )
  })
})

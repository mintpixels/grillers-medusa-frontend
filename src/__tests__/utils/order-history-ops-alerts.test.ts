import { emitOrderHistoryDataFailureAlert } from "@lib/order-history-ops-alerts"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

describe("order history ops alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("emits a warn alert when order history falls back to empty or partial data", async () => {
    await emitOrderHistoryDataFailureAlert({
      stage: "legacy_customer_orders",
      mode: "customer",
      limit: 100,
      offset: 0,
      error: new Error("legacy service unavailable"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "order_history_data_degraded",
        severity: "warn",
        title: "Order history legacy_customer_orders unavailable; using fallback",
        path: "src/lib/data/orders.ts",
        fingerprint: "order_history:legacy_customer_orders:customer",
        meta: expect.objectContaining({
          order_history_stage: "legacy_customer_orders",
          access_mode: "customer",
          limit: 100,
          offset: 0,
          failure_count: null,
          error_message: "legacy service unavailable",
        }),
      })
    )
  })
})

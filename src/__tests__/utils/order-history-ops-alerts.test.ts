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
      stage: "account_recent_orders",
      mode: "customer",
      error: new Error("legacy service unavailable"),
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "order_history_data_degraded",
        severity: "warn",
        title: "Order history account_recent_orders unavailable; using fallback",
        path: "src/lib/data/orders.ts",
        fingerprint: "order_history:account_recent_orders:customer",
        meta: expect.objectContaining({
          order_history_stage: "account_recent_orders",
          access_mode: "customer",
          limit: null,
          offset: null,
          failure_count: null,
          error_message: "legacy service unavailable",
        }),
      })
    )
  })
})

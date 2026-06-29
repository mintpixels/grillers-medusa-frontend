import { sdk } from "@lib/config"
import { getActiveStaffImpersonation } from "@lib/data/customer"
import { retrieveOrder } from "@lib/data/orders"
import { adminFetch } from "@lib/data/staff/admin"
import { emitOrderHistoryDataFailureAlert } from "@lib/order-history-ops-alerts"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/data/customer", () => ({
  getActiveStaffImpersonation: jest.fn(),
}))

jest.mock("@lib/data/staff/admin", () => ({
  adminFetch: jest.fn(),
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn(async () => ({ authorization: "Bearer test" })),
  getCacheOptions: jest.fn(async () => ({ next: { revalidate: 1 } })),
}))

jest.mock("@lib/order-history-ops-alerts", () => ({
  emitOrderHistoryDataFailureAlert: jest.fn(async () => undefined),
}))

const sdkFetchMock = sdk.client.fetch as jest.MockedFunction<
  typeof sdk.client.fetch
>
const getActiveStaffImpersonationMock =
  getActiveStaffImpersonation as jest.MockedFunction<
    typeof getActiveStaffImpersonation
  >
const adminFetchMock = adminFetch as jest.MockedFunction<typeof adminFetch>
const emitOrderHistoryDataFailureAlertMock =
  emitOrderHistoryDataFailureAlert as jest.MockedFunction<
    typeof emitOrderHistoryDataFailureAlert
  >

describe("retrieveOrder alerting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getActiveStaffImpersonationMock.mockResolvedValue(null)
    sdkFetchMock.mockResolvedValue({ order: { id: "order_test" } } as any)
    adminFetchMock.mockResolvedValue({
      order: {
        id: "order_test",
        customer_id: "cus_staff",
        email: "staff-customer@example.com",
        metadata: {},
      },
    } as any)
  })

  it("alerts when a customer order detail read fails", async () => {
    const error = new Error("Store API unavailable")
    sdkFetchMock.mockRejectedValue(error)

    await expect(retrieveOrder("order_customer")).rejects.toThrow(
      "Store API unavailable"
    )

    expect(emitOrderHistoryDataFailureAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "order_detail",
        mode: "customer",
        orderId: "order_customer",
        error,
      })
    )
  })

  it("alerts when a staff impersonation order detail read fails", async () => {
    const error = new Error("Admin API unavailable")
    getActiveStaffImpersonationMock.mockResolvedValue({
      session: {
        targetCustomerId: "cus_staff",
        targetEmail: "staff-customer@example.com",
      },
    } as any)
    adminFetchMock.mockRejectedValue(error)

    await expect(retrieveOrder("order_staff")).rejects.toThrow(
      "Admin API unavailable"
    )

    expect(emitOrderHistoryDataFailureAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "order_detail",
        mode: "staff_impersonation",
        orderId: "order_staff",
        error,
      })
    )
  })

  it("does not alert on staff impersonation ownership mismatches", async () => {
    getActiveStaffImpersonationMock.mockResolvedValue({
      session: {
        targetCustomerId: "cus_staff",
        targetEmail: "staff-customer@example.com",
      },
    } as any)
    adminFetchMock.mockResolvedValue({
      order: {
        id: "order_other",
        customer_id: "cus_other",
        email: "other@example.com",
        metadata: {},
      },
    } as any)

    await expect(retrieveOrder("order_other")).rejects.toThrow(
      "Order does not belong to the impersonated customer."
    )

    expect(emitOrderHistoryDataFailureAlertMock).not.toHaveBeenCalled()
  })
})

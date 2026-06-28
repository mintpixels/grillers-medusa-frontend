const mockRetrieveAuthenticatedCustomerForStaffAccess = jest.fn()
const mockAdminFetch = jest.fn()
const mockEmitStorefrontOpsAlert = jest.fn()

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess:
    mockRetrieveAuthenticatedCustomerForStaffAccess,
}))

jest.mock("@lib/data/staff/admin", () => ({
  adminFetch: mockAdminFetch,
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: mockEmitStorefrontOpsAlert,
}))

describe("staff QuickBooks sync ops alerts", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockRetrieveAuthenticatedCustomerForStaffAccess.mockResolvedValue({
      id: "cus_actor",
      email: "ops@example.com",
      first_name: "Ops",
      last_name: "Admin",
      metadata: { gp_staff_role: "super_admin" },
    })
    mockEmitStorefrontOpsAlert.mockResolvedValue({ ok: true, skipped: false })
  })

  it("emits a warn alert when the sync status workspace load fails", async () => {
    mockAdminFetch.mockRejectedValue(new Error("sync status endpoint down"))

    const { getStaffQuickBooksSyncStatus } = await import(
      "@lib/data/staff/quickbooks-sync"
    )

    await expect(
      getStaffQuickBooksSyncStatus({
        status: "stuck",
        search: "  #1234  ",
        page: 3,
        perPage: 50,
      })
    ).rejects.toThrow("sync status endpoint down")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_quickbooks_sync_status_failed",
        severity: "warn",
        fingerprint: "staff_quickbooks_sync:status:failed",
        meta: expect.objectContaining({
          staff_module: "quickbooks_sync",
          action: "load_status",
          status_filter: "stuck",
          search_present: true,
          page: 3,
          per_page: 50,
          error_message: "sync status endpoint down",
        }),
      })
    )
  })

  it("emits a warn alert when a QuickBooks sync requeue fails", async () => {
    mockAdminFetch.mockRejectedValue(new Error("requeue write failed"))

    const { requeueStaffQuickBooksSyncOrder } = await import(
      "@lib/data/staff/quickbooks-sync"
    )

    await expect(
      requeueStaffQuickBooksSyncOrder(42, "Retry after fixing tax mapping.")
    ).rejects.toThrow("requeue write failed")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_quickbooks_sync_requeue_failed",
        severity: "warn",
        fingerprint: "staff_quickbooks_sync:requeue:failed",
        meta: expect.objectContaining({
          staff_module: "quickbooks_sync",
          action: "requeue_order",
          sync_order_id: 42,
          error_message: "requeue write failed",
        }),
      })
    )
  })

  it("does not alert for local staff access denials before backend calls", async () => {
    mockRetrieveAuthenticatedCustomerForStaffAccess.mockResolvedValue({
      id: "cus_customer",
      email: "customer@example.com",
      metadata: {},
    })

    const { getStaffQuickBooksSyncStatus } = await import(
      "@lib/data/staff/quickbooks-sync"
    )

    await expect(getStaffQuickBooksSyncStatus()).rejects.toThrow(
      "Order support access required."
    )
    expect(mockAdminFetch).not.toHaveBeenCalled()
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})

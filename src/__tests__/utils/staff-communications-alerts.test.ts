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

describe("staff communications ops alerts", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockRetrieveAuthenticatedCustomerForStaffAccess.mockResolvedValue({
      id: "cus_staff",
      email: "staff@example.com",
      first_name: "Avi",
      last_name: "Swerdlow",
      metadata: { gp_staff_role: "super_admin" },
    })
    mockEmitStorefrontOpsAlert.mockResolvedValue({ ok: true, skipped: false })
  })

  it("emits a warn alert when the communications overview fails to load", async () => {
    mockAdminFetch.mockRejectedValue(new Error("communications API offline"))

    const { getCommunicationOverview } = await import(
      "@lib/data/staff/communications"
    )

    await expect(getCommunicationOverview()).rejects.toThrow(
      "communications API offline"
    )

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_communications_overview_failed",
        severity: "warn",
        title: "Staff communications overview load failed",
        fingerprint: "staff_communications:overview:failed",
        meta: expect.objectContaining({
          staff_module: "communications",
          action: "load_overview",
          staff_actor_customer_id: "cus_staff",
          error_message: "communications API offline",
        }),
      })
    )
  })

  it("emits a PII-safe warn alert when profile search fails", async () => {
    mockAdminFetch.mockRejectedValue(new Error("profile search timed out"))

    const { searchCommunicationProfiles } = await import(
      "@lib/data/staff/communications"
    )

    await expect(
      searchCommunicationProfiles("customer@example.com")
    ).rejects.toThrow("profile search timed out")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_communications_profile_search_failed",
        severity: "warn",
        fingerprint: "staff_communications:profile_search:failed",
        meta: expect.objectContaining({
          staff_module: "communications",
          action: "search_profiles",
          query_kind: "email",
          query_length_bucket: 20,
          limit: 25,
          error_message: "profile search timed out",
        }),
      })
    )
    expect(
      JSON.stringify(mockEmitStorefrontOpsAlert.mock.calls[0][0].meta)
    ).not.toContain("customer@example.com")
  })

  it("emits a page alert when a production campaign send fails", async () => {
    mockAdminFetch.mockRejectedValue(new Error("postmark send failed"))

    const { sendCommunicationCampaign } = await import(
      "@lib/data/staff/communications"
    )

    await expect(sendCommunicationCampaign("cmp_123")).rejects.toThrow(
      "postmark send failed"
    )

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_communications_campaign_send_failed",
        severity: "page",
        fingerprint: "staff_communications:campaign_send:failed",
        meta: expect.objectContaining({
          staff_module: "communications",
          action: "send_campaign",
          campaign_id: "cmp_123",
          test_send: false,
          error_message: "postmark send failed",
        }),
      })
    )
  })

  it("keeps test campaign send failures at warning severity", async () => {
    mockAdminFetch.mockRejectedValue(new Error("test send failed"))

    const { sendCommunicationCampaign } = await import(
      "@lib/data/staff/communications"
    )

    await expect(
      sendCommunicationCampaign("cmp_123", { test_email: "staff@example.com" })
    ).rejects.toThrow("test send failed")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_communications_campaign_send_failed",
        severity: "warn",
        meta: expect.objectContaining({
          test_send: true,
        }),
      })
    )
  })

  it("emits a PII-safe page alert when direct staff messaging fails", async () => {
    mockAdminFetch.mockRejectedValue(new Error("direct send failed"))

    const { sendStaffCommunication } = await import(
      "@lib/data/staff/communications"
    )

    await expect(
      sendStaffCommunication({
        to: "customer@example.com",
        subject: "Private subject",
        body: "Message body that should not be copied into alerts.",
        stream: "transactional",
        order_id: "order_123",
        profile_id: "profile_123",
      })
    ).rejects.toThrow("direct send failed")

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_communications_direct_send_failed",
        severity: "page",
        fingerprint: "staff_communications:direct_send:failed",
        meta: expect.objectContaining({
          staff_module: "communications",
          action: "send_direct_message",
          stream: "transactional",
          order_id: "order_123",
          profile_id: "profile_123",
          body_length_bucket: 500,
          recipient_has_at: true,
          error_message: "direct send failed",
        }),
      })
    )
    const alertMeta = JSON.stringify(
      mockEmitStorefrontOpsAlert.mock.calls[0][0].meta
    )
    expect(alertMeta).not.toContain("customer@example.com")
    expect(alertMeta).not.toContain("Private subject")
    expect(alertMeta).not.toContain("Message body")
  })

  it("does not alert for local office-console access denials", async () => {
    mockRetrieveAuthenticatedCustomerForStaffAccess.mockResolvedValue({
      id: "cus_customer",
      email: "customer@example.com",
      metadata: {},
    })

    const { getCommunicationOverview } = await import(
      "@lib/data/staff/communications"
    )

    await expect(getCommunicationOverview()).rejects.toThrow(
      "Office console access required."
    )
    expect(mockAdminFetch).not.toHaveBeenCalled()
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })
})

export {}

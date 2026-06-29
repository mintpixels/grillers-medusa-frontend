jest.mock("server-only", () => ({}))

import {
  startStaffImpersonation,
  stopStaffImpersonation,
} from "@lib/data/staff/impersonation"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import {
  clearStaffImpersonationCookie,
  writeStaffImpersonationCookie,
} from "@lib/data/staff/session-cookie"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"

jest.mock("@lib/data/customer", () => ({
  retrieveAuthenticatedCustomerForStaffAccess: jest.fn(),
}))

jest.mock("@lib/data/staff/session-cookie", () => ({
  clearStaffImpersonationCookie: jest.fn(),
  readStaffImpersonationCookie: jest.fn(),
  writeStaffImpersonationCookie: jest.fn(),
}))

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const mockRetrieveStaff =
  retrieveAuthenticatedCustomerForStaffAccess as jest.MockedFunction<
    typeof retrieveAuthenticatedCustomerForStaffAccess
  >
const mockWriteStaffImpersonationCookie =
  writeStaffImpersonationCookie as jest.MockedFunction<
    typeof writeStaffImpersonationCookie
  >
const mockClearStaffImpersonationCookie =
  clearStaffImpersonationCookie as jest.MockedFunction<
    typeof clearStaffImpersonationCookie
  >
const mockEmitStorefrontOpsAlert =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

const officeStaff = {
  id: "cus_staff",
  email: "staff@example.com",
  first_name: "Avi",
  last_name: "Swerdlow",
  metadata: { gp_staff_role: "office" },
} as any

describe("staff impersonation alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRetrieveStaff.mockResolvedValue(officeStaff)
    mockWriteStaffImpersonationCookie.mockResolvedValue(undefined)
    mockClearStaffImpersonationCookie.mockResolvedValue(undefined)
  })

  it("alerts when staff impersonation cannot write the signed session cookie", async () => {
    mockWriteStaffImpersonationCookie.mockRejectedValueOnce(
      new Error("cookie write failed for staff@example.com cus_target")
    )

    const result = await startStaffImpersonation({
      targetCustomerId: "cus_target",
      targetEmail: "customer@example.com",
      targetName: "Customer",
    })

    expect(result).toEqual({
      ok: false,
      error: "cookie write failed for staff@example.com cus_target",
    })
    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_impersonation_failed",
        severity: "warn",
        title: "Staff impersonation failed",
        path: "src/lib/data/staff/impersonation.ts",
        source: "storefront-server",
        fingerprint: "staff_impersonation_failed:start:cookie_write",
        meta: expect.objectContaining({
          staff_module: "customer_context",
          action: "start",
          failure_stage: "cookie_write",
          staff_actor_customer_id: "cus_staff",
          target_customer_id: "cus_target",
          has_target_customer_id: true,
          error_message:
            "cookie write failed for [redacted-email] [redacted-id]",
        }),
      })
    )
  })

  it("does not alert for expected office-console permission denials", async () => {
    mockRetrieveStaff.mockResolvedValueOnce(null)

    const result = await startStaffImpersonation({
      targetCustomerId: "cus_target",
      targetEmail: "customer@example.com",
      targetName: "Customer",
    })

    expect(result).toEqual({
      ok: false,
      error: "Office console access required.",
    })
    expect(mockWriteStaffImpersonationCookie).not.toHaveBeenCalled()
    expect(mockEmitStorefrontOpsAlert).not.toHaveBeenCalled()
  })

  it("alerts and preserves throw behavior when staff impersonation cannot clear", async () => {
    mockClearStaffImpersonationCookie.mockRejectedValueOnce(
      new Error("cookie clear failed for staff@example.com")
    )

    await expect(stopStaffImpersonation()).rejects.toThrow(
      "cookie clear failed for staff@example.com"
    )

    expect(mockEmitStorefrontOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "staff_impersonation_failed",
        fingerprint: "staff_impersonation_failed:stop:cookie_clear",
        meta: expect.objectContaining({
          staff_module: "customer_context",
          action: "stop",
          failure_stage: "cookie_clear",
          staff_actor_customer_id: null,
          target_customer_id: null,
          has_target_customer_id: false,
          error_message: "cookie clear failed for [redacted-email]",
        }),
      })
    )
  })
})

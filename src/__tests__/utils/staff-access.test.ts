import {
  isStaffCustomer,
  isStaffMetadata,
  isSuperAdminCustomer,
  staffAccessRole,
  staffDisplayName,
  staffMetadataRole,
} from "@lib/util/staff-access"

describe("staff access helpers", () => {
  it("accepts explicit staff flags", () => {
    expect(isStaffMetadata({ is_staff: true })).toBe(true)
    expect(isStaffMetadata({ gp_staff: "true" })).toBe(true)
    expect(isStaffMetadata({ phone_order_staff: "1" })).toBe(true)
  })

  it("accepts staff roles", () => {
    expect(isStaffMetadata({ staff_role: "customer_service" })).toBe(true)
    expect(isStaffMetadata({ role: "ops" })).toBe(true)
    expect(staffMetadataRole({ gp_staff_role: "super_admin" })).toBe(
      "super_admin"
    )
  })

  it("rejects normal customer metadata", () => {
    expect(isStaffMetadata(null)).toBe(false)
    expect(isStaffMetadata({ vip: true })).toBe(false)
    expect(isStaffCustomer({ metadata: { role: "customer" } } as any)).toBe(false)
    expect(
      isStaffCustomer({
        metadata: { staff_role: "staff", staff_access_revoked: true },
      } as any)
    ).toBe(false)
  })

  it("bootstraps Avi and Peter as super admins", () => {
    const avi = {
      email: "aviswerdlow@gmail.com",
      metadata: { role: "customer" },
    } as any
    const peter = {
      email: "Peter@grillerspride.com",
      metadata: { role: "customer" },
    } as any

    expect(isStaffCustomer(avi)).toBe(true)
    expect(isSuperAdminCustomer(avi)).toBe(true)
    expect(staffAccessRole(peter)).toBe("super_admin")
  })

  it("formats a staff display name safely", () => {
    expect(
      staffDisplayName({
        first_name: "Avi",
        last_name: "Swerdlow",
        email: "avi@example.com",
      } as any)
    ).toBe("Avi Swerdlow")
    expect(staffDisplayName({ email: "staff@example.com" } as any)).toBe(
      "staff@example.com"
    )
  })
})

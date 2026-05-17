import {
  actionIsBlockedByOperationalState,
  actionMovesMoney,
  actionRequiresCustomerConsent,
  parseStaffAuditLog,
  staffOrderOperationalState,
} from "@lib/data/staff/exception-types"

describe("staff exception helpers", () => {
  it("parses staff audit log strings safely", () => {
    expect(
      parseStaffAuditLog({
        staff_audit_log: JSON.stringify([{ action: "refund_payment" }]),
      })
    ).toEqual([{ action: "refund_payment" }])

    expect(parseStaffAuditLog({ staff_audit_log: "not json" })).toEqual([])
    expect(parseStaffAuditLog(null)).toEqual([])
  })

  it("detects operational order states", () => {
    expect(staffOrderOperationalState({ status: "canceled" })).toBe("canceled")
    expect(
      staffOrderOperationalState({
        fulfillment_status: "fulfilled",
        fulfillments: [{ id: "ful_1" }],
      })
    ).toBe("fulfillment_locked")
    expect(
      staffOrderOperationalState({
        fulfillment_status: "shipped",
        fulfillments: [{ id: "ful_1", shipped_at: "2026-05-17" }],
      })
    ).toBe("completed_or_shipped")
    expect(staffOrderOperationalState({ payment_status: "captured" })).toBe(
      "confirmed"
    )
  })

  it("marks money movement and consent requirements", () => {
    expect(actionMovesMoney("refund_payment")).toBe(true)
    expect(actionMovesMoney("shipping_override")).toBe(false)
    expect(actionRequiresCustomerConsent("shipping_override")).toBe(true)
    expect(actionRequiresCustomerConsent("record_note")).toBe(false)
  })

  it("blocks unsafe actions after cancellation or shipment", () => {
    expect(actionIsBlockedByOperationalState("cancel_order", "completed_or_shipped")).toBe(
      true
    )
    expect(actionIsBlockedByOperationalState("capture_payment", "completed_or_shipped")).toBe(
      true
    )
    expect(actionIsBlockedByOperationalState("credit_memo", "completed_or_shipped")).toBe(
      false
    )
    expect(actionIsBlockedByOperationalState("refund_payment", "canceled")).toBe(true)
    expect(actionIsBlockedByOperationalState("record_note", "canceled")).toBe(false)
  })
})

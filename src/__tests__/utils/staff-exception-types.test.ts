import {
  actionIsBlockedByOperationalState,
  actionIsAuditOnly,
  actionMovesMoney,
  actionMutatesMedusa,
  actionRequiredConfirmation,
  actionRequiresQuickBooksPosting,
  actionRequiresCustomerConsent,
  parseStaffAuditLog,
  staffOrderItemEditEligibility,
  staffOrderOperationalState,
  staffOrderPickPackPhase,
  staffOrderSupportActionAvailability,
  VISIBLE_STAFF_EXCEPTION_ACTIONS,
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
    expect(
      staffOrderOperationalState({
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
      })
    ).toBe("confirmed")
  })

  it("marks money movement and consent requirements", () => {
    expect(actionMovesMoney("refund_payment")).toBe(true)
    expect(actionMovesMoney("record_check_refund")).toBe(true)
    expect(actionMovesMoney("shipping_override")).toBe(false)
    expect(actionRequiresCustomerConsent("shipping_override")).toBe(true)
    expect(actionRequiresCustomerConsent("record_note")).toBe(false)
  })

  it("separates audit-only actions from Medusa mutations", () => {
    expect(actionMutatesMedusa("refund_payment")).toBe(true)
    expect(actionMutatesMedusa("capture_payment")).toBe(true)
    expect(actionMutatesMedusa("edit_order_items")).toBe(true)
    expect(actionMutatesMedusa("cancel_order")).toBe(true)
    expect(actionIsAuditOnly("shipping_override")).toBe(true)
    expect(actionIsAuditOnly("credit_memo")).toBe(true)
    expect(actionIsAuditOnly("record_check_refund")).toBe(true)
  })

  it("marks all accounting-sensitive actions for QuickBooks posting", () => {
    expect(actionRequiresQuickBooksPosting("refund_payment")).toBe(true)
    expect(actionRequiresQuickBooksPosting("edit_order_items")).toBe(true)
    expect(actionRequiresQuickBooksPosting("capture_payment")).toBe(true)
    expect(actionRequiresQuickBooksPosting("cancel_order")).toBe(true)
    expect(actionRequiresQuickBooksPosting("record_offline_payment")).toBe(true)
    expect(actionRequiresQuickBooksPosting("credit_memo")).toBe(true)
    expect(actionRequiresQuickBooksPosting("record_check_refund")).toBe(true)
    expect(actionRequiresQuickBooksPosting("cancel_order")).toBe(true)
    expect(actionRequiresQuickBooksPosting("record_note")).toBe(true)
  })

  it("hides launch-disabled and customer-level actions from the order-support picker", () => {
    const visible = VISIBLE_STAFF_EXCEPTION_ACTIONS.map(
      (action) => action.value
    )
    expect(visible).not.toContain("record_offline_payment")
    expect(visible).toContain("edit_order_items")
    expect(visible).not.toContain("credit_memo")
    expect(visible).not.toContain("record_check_refund")
  })

  it("requires typed confirmation for destructive actions only", () => {
    expect(actionRequiredConfirmation("refund_payment")).toBe("REFUND")
    expect(actionRequiredConfirmation("capture_payment")).toBe("CAPTURE")
    expect(actionRequiredConfirmation("cancel_order")).toBe("CANCEL")
    expect(actionRequiredConfirmation("record_offline_payment")).toBeNull()
    expect(actionRequiredConfirmation("record_note")).toBeNull()
  })

  it("blocks unsafe actions after cancellation or shipment", () => {
    expect(
      actionIsBlockedByOperationalState("cancel_order", "completed_or_shipped")
    ).toBe(true)
    expect(
      actionIsBlockedByOperationalState(
        "capture_payment",
        "completed_or_shipped"
      )
    ).toBe(true)
    expect(
      actionIsBlockedByOperationalState("credit_memo", "completed_or_shipped")
    ).toBe(false)
    expect(
      actionIsBlockedByOperationalState(
        "edit_order_items",
        "completed_or_shipped"
      )
    ).toBe(true)
    expect(
      actionIsBlockedByOperationalState(
        "edit_order_items",
        "fulfillment_locked"
      )
    ).toBe(true)
    expect(
      actionIsBlockedByOperationalState("refund_payment", "canceled")
    ).toBe(false)
    expect(
      actionIsBlockedByOperationalState("retry_qbd_posting", "canceled")
    ).toBe(false)
    expect(actionIsBlockedByOperationalState("record_note", "canceled")).toBe(
      false
    )
    expect(
      actionIsBlockedByOperationalState(
        "shipping_override",
        "fulfillment_locked"
      )
    ).toBe(true)
  })

  it("allows order item edits only before a pick is claimed", () => {
    expect(staffOrderItemEditEligibility({ metadata: {} }).canEdit).toBe(true)
    expect(
      staffOrderItemEditEligibility({
        metadata: { finalization_status: "pending_pick" },
      }).canEdit
    ).toBe(true)
    expect(
      staffOrderItemEditEligibility({
        metadata: { finalization_status: "pending_pack" },
      }).canEdit
    ).toBe(true)
    expect(
      staffOrderItemEditEligibility({
        metadata: { finalization_status: "picking" },
      }).canEdit
    ).toBe(false)
    expect(
      staffOrderItemEditEligibility({
        metadata: { finalization_status: "ready_for_packing" },
      }).canEdit
    ).toBe(false)
  })

  it("classifies pick, pack, charge, and fulfillment phases", () => {
    expect(staffOrderPickPackPhase({ metadata: {} })).toBe("pre_pick")
    expect(
      staffOrderPickPackPhase({
        metadata: { finalization_status: "picking" },
      })
    ).toBe("picking")
    expect(
      staffOrderPickPackPhase({
        metadata: { finalization_status: "ready_for_packing" },
      })
    ).toBe("packing")
    expect(
      staffOrderPickPackPhase({
        metadata: { finalization_status: "packed_pending_charge" },
      })
    ).toBe("ready_to_charge")
    expect(
      staffOrderPickPackPhase({
        metadata: { finalization_status: "charge_failed_hold" },
      })
    ).toBe("charge_hold")
    expect(
      staffOrderPickPackPhase({
        metadata: { finalization_status: "charged_ready_to_ship" },
      })
    ).toBe("ready_to_ship")
  })

  it("gates order support actions by pick-pack phase and staff role", () => {
    const prePickOrder = { metadata: { finalization_status: "pending_pick" } }
    const pickingOrder = { metadata: { finalization_status: "picking" } }
    const readyShipOrder = {
      metadata: { finalization_status: "charged_ready_to_ship" },
    }
    const failedQbdOrder = {
      metadata: {
        finalization_status: "picking",
        qbd_posting_status: "failed",
      },
    }

    expect(
      staffOrderSupportActionAvailability("edit_order_items", prePickOrder, {
        staffRole: "office",
      }).available
    ).toBe(true)
    expect(
      staffOrderSupportActionAvailability("shipping_override", pickingOrder, {
        staffRole: "office",
      }).available
    ).toBe(false)
    expect(
      staffOrderSupportActionAvailability("cancel_order", pickingOrder, {
        staffRole: "office",
      }).available
    ).toBe(false)
    expect(
      staffOrderSupportActionAvailability("cancel_order", pickingOrder, {
        staffRole: "manager",
      }).available
    ).toBe(true)
    expect(
      staffOrderSupportActionAvailability("capture_payment", pickingOrder, {
        staffRole: "manager",
      }).available
    ).toBe(false)
    expect(
      staffOrderSupportActionAvailability("credit_memo", prePickOrder, {
        staffRole: "office",
      }).available
    ).toBe(false)
    expect(
      staffOrderSupportActionAvailability("credit_memo", readyShipOrder, {
        staffRole: "office",
      }).available
    ).toBe(true)
    expect(
      staffOrderSupportActionAvailability("retry_qbd_posting", failedQbdOrder, {
        staffRole: "office",
      }).available
    ).toBe(true)
    expect(
      staffOrderSupportActionAvailability(
        "record_offline_payment",
        prePickOrder,
        {
          staffRole: "manager",
        }
      ).available
    ).toBe(false)
  })
})

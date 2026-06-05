import {
  parseStaffCustomerAccountCredits,
  parseStaffCustomerAccountNotes,
  staffCustomerAccountCreditBalance,
  staffCustomerAccountCreditBalanceMinor,
  staffCustomerAccountReasonLabel,
} from "@lib/data/staff/customer-account-ledger"

describe("staff customer account ledger helpers", () => {
  it("parses account credits and calculates the active balance", () => {
    const metadata = {
      customer_account_credits: JSON.stringify([
        {
          id: "credit_1",
          amount_minor: 1250,
          reason_code: "goodwill",
          staff_note: "Make-good credit",
          status: "pending_qbd",
          qbd_posting_status: "pending_manual",
          created_at: "2026-06-04T12:00:00.000Z",
        },
        {
          id: "credit_2",
          amount_minor: 400,
          reason_code: "delivery_issue",
          staff_note: "Voided duplicate",
          status: "void",
          created_at: "2026-06-04T12:10:00.000Z",
        },
      ]),
    }

    expect(parseStaffCustomerAccountCredits(metadata)).toEqual([
      expect.objectContaining({
        id: "credit_1",
        amount: 12.5,
        amountMinor: 1250,
        reasonCode: "goodwill",
        qbdPostingStatus: "pending_manual",
      }),
      expect.objectContaining({
        id: "credit_2",
        amountMinor: 400,
        status: "void",
      }),
    ])
    expect(staffCustomerAccountCreditBalanceMinor(metadata)).toBe(1250)
    expect(staffCustomerAccountCreditBalance(metadata)).toBe(12.5)
  })

  it("uses the explicit balance when present", () => {
    expect(
      staffCustomerAccountCreditBalanceMinor({
        customer_account_credit_balance_minor: 375,
        customer_account_credits: JSON.stringify([
          { id: "credit_1", amount_minor: 100 },
        ]),
      })
    ).toBe(375)
  })

  it("parses notes and tolerates malformed metadata", () => {
    expect(
      parseStaffCustomerAccountNotes({
        customer_account_notes: JSON.stringify([
          {
            id: "note_1",
            note: "Customer prefers future account credit",
            reason_code: "refund_alternative",
            created_at: "2026-06-04T12:00:00.000Z",
          },
        ]),
      })
    ).toEqual([
      expect.objectContaining({
        id: "note_1",
        reasonCode: "refund_alternative",
      }),
    ])

    expect(
      parseStaffCustomerAccountCredits({
        customer_account_credits: "not json",
      })
    ).toEqual([])
    expect(staffCustomerAccountReasonLabel("delivery_issue")).toBe(
      "Delivery issue"
    )
    expect(staffCustomerAccountReasonLabel("unknown")).toBe("Other")
  })
})

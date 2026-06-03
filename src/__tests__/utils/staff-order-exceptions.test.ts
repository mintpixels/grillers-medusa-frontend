import {
  collectStaffOrderPayments,
  validateFullStripeCaptureAmount,
} from "@lib/data/staff/order-exception-payments"

describe("staff order exception payment helpers", () => {
  it("uses Medusa capture and refund rows when aggregate payment fields are absent", () => {
    const payments = collectStaffOrderPayments({
      payment_collections: [
        {
          currency_code: "usd",
          provider_id: "pp_stripe_stripe",
          payments: [
            {
              id: "pay_123",
              amount: 83.68,
              status: "authorized",
              captures: [{ amount: 83.68 }],
              refunds: [{ amount: 0.01 }],
            },
          ],
        },
      ],
    })

    expect(payments).toEqual([
      expect.objectContaining({
        id: "pay_123",
        amount: 83.68,
        capturedAmount: 83.68,
        refundedAmount: 0.01,
        refundableAmount: 83.67,
      }),
    ])
  })

  it("blocks partial Stripe captures because the provider captures the full intent", () => {
    expect(() =>
      validateFullStripeCaptureAmount({ captureAmount: 0.01, remaining: 83.68 })
    ).toThrow("Capture amount must equal the full remaining Stripe authorization")
    expect(() =>
      validateFullStripeCaptureAmount({ captureAmount: 83.68, remaining: 83.68 })
    ).not.toThrow()
  })
})

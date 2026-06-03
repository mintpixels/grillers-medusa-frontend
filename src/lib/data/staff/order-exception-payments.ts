import {
  staffCapturedCurrencyAmount,
  staffCurrencyAmount,
} from "./money"

type AnyRecord = Record<string, any>

export type StaffOrderPayment = {
  id: string
  amount: number
  capturedAmount: number
  refundedAmount: number
  refundableAmount: number
  currencyCode: string
  providerId?: string
  status?: string
}

function amount(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function collectStaffOrderPayments(
  order: AnyRecord
): StaffOrderPayment[] {
  const collections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : []

  return collections.flatMap((collection: AnyRecord) => {
    const payments = Array.isArray(collection.payments)
      ? collection.payments
      : []
    return payments.map((payment: AnyRecord) => {
      const captures = Array.isArray(payment.captures) ? payment.captures : []
      const refunds = Array.isArray(payment.refunds) ? payment.refunds : []
      const explicitCapturedAmount = numericValue(payment.captured_amount)
      const capturedRowsAmount = captures.reduce(
        (sum: number, capture: AnyRecord) => sum + amount(capture.amount),
        0
      )
      const explicitRefundedAmount = numericValue(payment.refunded_amount)
      const refundedAmount = staffCurrencyAmount(
        explicitRefundedAmount !== null
          ? explicitRefundedAmount
          : refunds.reduce(
              (sum: number, refund: AnyRecord) => sum + amount(refund.amount),
              0
            )
      )
      const paymentAmount = staffCurrencyAmount(payment.amount)
      const paymentStatus = String(
        payment.status || collection.status || ""
      ).toLowerCase()
      const capturedAmount = staffCapturedCurrencyAmount({
        capturedAmount:
          explicitCapturedAmount !== null
            ? explicitCapturedAmount
            : capturedRowsAmount > 0
            ? capturedRowsAmount
            : undefined,
        paymentAmount,
        status: paymentStatus,
      })

      return {
        id: payment.id,
        amount: paymentAmount,
        capturedAmount,
        refundedAmount,
        refundableAmount: staffCurrencyAmount(
          Math.max(0, capturedAmount - refundedAmount)
        ),
        currencyCode:
          payment.currency_code || collection.currency_code || "usd",
        providerId:
          payment.provider_id || payment.provider || collection.provider_id,
        status: payment.status || collection.status,
      }
    })
  })
}

export function validateFullStripeCaptureAmount({
  captureAmount,
  remaining,
}: {
  captureAmount: number
  remaining: number
}) {
  if (captureAmount > remaining) {
    throw new Error(
      `Capture amount exceeds the remaining authorized balance of ${remaining.toFixed(
        2
      )}.`
    )
  }
  if (Math.abs(captureAmount - remaining) > 0.005) {
    throw new Error(
      `Capture amount must equal the full remaining Stripe authorization of ${remaining.toFixed(
        2
      )}. Partial capture is not available in this console.`
    )
  }
}

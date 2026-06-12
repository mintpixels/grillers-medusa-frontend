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

function metadataObject(value: unknown): AnyRecord {
  if (!value) return {}
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {}
    } catch {
      return {}
    }
  }
  return typeof value === "object" && !Array.isArray(value)
    ? { ...(value as AnyRecord) }
    : {}
}

export function collectStaffOrderPayments(
  order: AnyRecord
): StaffOrderPayment[] {
  const collections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : []

  const medusaPayments = collections.flatMap((collection: AnyRecord) => {
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

  const metadata = metadataObject(order.metadata)
  const paymentIntentId = metadata.stripe_payment_intent_id
  if (
    metadata.final_charge_status === "succeeded" &&
    typeof paymentIntentId === "string" &&
    paymentIntentId
  ) {
    const capturedAmount = staffCurrencyAmount(
      metadata.final_total ||
        metadata.final_order_total ||
        metadata.final_charge_amount ||
        order.total ||
        0
    )
    const refundedAmount = staffCurrencyAmount(
      metadata.final_charge_refunded_amount || 0
    )
    medusaPayments.push({
      id: `final_charge:${paymentIntentId}`,
      amount: capturedAmount,
      capturedAmount,
      refundedAmount,
      refundableAmount: staffCurrencyAmount(
        Math.max(0, capturedAmount - refundedAmount)
      ),
      currencyCode: order.currency_code || "usd",
      providerId: "pp_stripe_final_charge",
      status:
        refundedAmount >= capturedAmount
          ? "refunded"
          : refundedAmount > 0
          ? "partially_refunded"
          : "captured",
    })
  }

  return medusaPayments
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

export function staffNumericAmount(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function staffCurrencyAmount(value: unknown): number {
  const amount = staffNumericAmount(value)
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function staffPositiveCurrencyAmount(value: unknown): number {
  const amount = staffCurrencyAmount(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a positive amount.")
  }
  return amount
}

export function staffMinorUnitsFromCurrency(value: unknown): number {
  return Math.round(staffPositiveCurrencyAmount(value) * 100)
}

export function staffCapturedCurrencyAmount({
  capturedAmount,
  paymentAmount,
  status,
}: {
  capturedAmount?: unknown
  paymentAmount: unknown
  status?: unknown
}): number {
  const hasExplicitCapturedAmount =
    capturedAmount !== undefined &&
    capturedAmount !== null &&
    capturedAmount !== ""

  if (hasExplicitCapturedAmount) {
    return staffCurrencyAmount(capturedAmount)
  }

  const paymentStatus = String(status || "").toLowerCase()
  return paymentStatus.includes("captur") || paymentStatus === "paid"
    ? staffCurrencyAmount(paymentAmount)
    : 0
}

export function formatStaffMoney(value?: number, currencyCode = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(staffCurrencyAmount(value ?? 0))
}

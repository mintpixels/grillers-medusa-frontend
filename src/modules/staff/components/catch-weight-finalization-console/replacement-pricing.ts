type ReplacementProduct = {
  title?: string
  calculatedAmount?: number
  currencyCode?: string
}

function money(value: number, currencyCode = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(value)
}

export function parsePerLbUnitPrice(title?: string | null): number | null {
  if (!title) return null
  const match = title.match(
    /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/\s*)?(?:lb|lbs|pound|pounds)\b/i
  )
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

export function replacementUnitPrice(
  product: ReplacementProduct
): number | null {
  const perLb = parsePerLbUnitPrice(product.title)
  if (perLb !== null) return perLb
  return typeof product.calculatedAmount === "number"
    ? product.calculatedAmount
    : null
}

export function replacementPriceLabel(
  product: ReplacementProduct,
  fallbackCurrencyCode = "usd"
) {
  const currencyCode = product.currencyCode || fallbackCurrencyCode
  const perLb = parsePerLbUnitPrice(product.title)
  if (perLb !== null) return `${money(perLb, currencyCode)} / lb`
  if (typeof product.calculatedAmount === "number") {
    return money(product.calculatedAmount, currencyCode)
  }
  return "Price unavailable"
}

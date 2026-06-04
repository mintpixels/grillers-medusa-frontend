"use client"

import { useParams } from "next/navigation"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutBackToCartLink() {
  const params = useParams()
  const rawCountryCode = params?.countryCode
  const countryCode = Array.isArray(rawCountryCode)
    ? rawCountryCode[0]
    : rawCountryCode || "us"

  return (
    <a
      href={`/${countryCode}/cart`}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-x-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
      data-testid="back-link"
      aria-label="Back to cart"
    >
      <span className="hidden small:block">Back to cart</span>
      <span className="block small:hidden">Back</span>
      <ChevronDown className="-rotate-90" size={16} />
    </a>
  )
}

"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

// Net-weight authorization disclaimer
const NetWeightDisclaimer = () => (
  <div className="bg-Gold/10 border border-Gold/30 rounded-md p-4 mb-6">
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-Gold"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-Charcoal mb-1">
          About Your Order Total
        </p>
        <p className="text-sm text-Charcoal/70 leading-relaxed">
          Your card will be authorized for the estimated amount shown. The final
          charge will be based on actual product weights when your order is
          weighed and packed, and may vary slightly.{" "}
          <a
            href="/faq/net-weight-pricing"
            className="text-Gold hover:text-Gold/80 underline"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  </div>
)

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  // For now, assume all carts may contain net-weight items
  // In production, this should check cart items for net-weight products
  const hasNetWeightItems = true

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          {hasNetWeightItems && <NetWeightDisclaimer />}

          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                By clicking the Place Order button, you confirm that you have
                read, understand and accept our Terms of Use, Terms of Sale and
                Returns Policy and acknowledge that you have read Grillers
                Pride&apos;s Privacy Policy.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review

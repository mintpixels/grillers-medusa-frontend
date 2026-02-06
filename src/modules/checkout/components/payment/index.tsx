"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripe as isStripeFunc, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { trackAddPaymentInfo } from "@lib/gtm"
import { CreditCard } from "@medusajs/icons"
import { Button, Container, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentButton from "@modules/checkout/components/payment-button"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

// Net-weight authorization disclaimer
const NetWeightDisclaimer = () => (
  <div className="bg-Gold/10 border border-Gold/20 rounded-lg p-4 mb-5">
    <div className="flex gap-3">
      <div className="shrink-0">
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
        <p className="text-sm font-medium text-gray-900 mb-1">
          About Your Order Total
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your card will be authorized for the estimated amount shown. The final
          charge will be based on actual product weights when your order is
          weighed and packed.{" "}
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

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isStripe = isStripeFunc(selectedPaymentMethod)

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    // Initiate payment session for all payment methods (not just Stripe)
    try {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // All fulfillment types (including pickup) now set a shipping method on the cart,
  // so we always require shipping_methods to be present.
  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) > 0) || paidByGiftcard

  // Check if address step is complete (required before payment)
  const addressComplete = !!(cart?.shipping_address?.first_name && cart?.shipping_address?.address_1)

  // Payment section is always open once address is complete
  const isOpen = addressComplete

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  // For Stripe: initiate session when card details entered
  const handleInitiateStripe = async () => {
    setIsLoading(true)
    try {
      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      // Track add_payment_info event
      trackAddPaymentInfo({
        total: (cart.total || 0) / 100,
        currency: cart.currency_code?.toUpperCase(),
        paymentType: paymentInfoMap[selectedPaymentMethod]?.title || selectedPaymentMethod,
        items: cart.items?.map((item: any) => ({
          id: item.product_id || item.id,
          title: item.product_title || '',
          price: (item.unit_price || 0) / 100,
          quantity: item.quantity,
        })) || [],
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Check if all steps are ready to place order
  const readyToPlaceOrder = paymentReady && addressComplete

  return (
    <div>
      {/* Step header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={clx(
            "flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold",
            {
              "bg-Gold text-white": isOpen,
              "bg-gray-200 text-gray-400": !isOpen,
            }
          )}>
            3
          </span>
          <h2 className={clx("text-lg font-semibold", {
            "text-gray-900": isOpen,
            "text-gray-400": !isOpen,
          })}>Payment</h2>
        </div>
      </div>

      {isOpen && (
        <div>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => setPaymentMethod(value)}
            >
              {availablePaymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id}>
                  {isStripeFunc(paymentMethod.id) ? (
                    <StripeCardContainer
                      paymentProviderId={paymentMethod.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                      paymentInfoMap={paymentInfoMap}
                      setCardBrand={setCardBrand}
                      setError={setError}
                      setCardComplete={setCardComplete}
                    />
                  ) : (
                    <PaymentContainer
                      paymentInfoMap={paymentInfoMap}
                      paymentProviderId={paymentMethod.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                    />
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {paidByGiftcard && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment method</p>
              <p className="text-sm text-gray-600" data-testid="payment-method-summary">
                Gift card covers entire order
              </p>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          {/* For Stripe without active session, show button to enter card */}
          {isStripe && !activeSession && !paidByGiftcard && (
            <Button
              size="large"
              className="mt-5"
              onClick={handleInitiateStripe}
              isLoading={isLoading}
              disabled={!cardComplete}
              data-testid="submit-payment-button"
            >
              Enter card details
            </Button>
          )}

          {/* Place Order section - shown when payment is set up */}
          {(paymentReady || paidByGiftcard) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <NetWeightDisclaimer />
              
              <PaymentButton cart={cart} data-testid="submit-order-button" />
              
              <p className="text-xs text-gray-500 mt-4 leading-relaxed text-center">
                By clicking Complete Purchase, you agree to our{" "}
                <a href="/terms" className="text-Gold hover:underline">Terms of Use</a>,{" "}
                <a href="/terms-of-sale" className="text-Gold hover:underline">Terms of Sale</a>, and{" "}
                <a href="/privacy" className="text-Gold hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <p className="text-sm text-gray-400">Complete previous steps to continue</p>
      )}
    </div>
  )
}

export default Payment

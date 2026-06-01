"use client"

import {
  placeOrderWithSavedPaymentMethod,
  verifyCartInventoryForCheckout,
} from "@lib/data/cart"
import { jitsuTrack } from "@lib/jitsu"
import { HttpTypes } from "@medusajs/types"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useRef, useState } from "react"
import Spinner from "@modules/common/icons/spinner"

// Custom gold button matching btn-primary style
const GoldButton = ({
  children,
  disabled,
  isLoading,
  onClick,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  disabled?: boolean
  isLoading?: boolean
  onClick?: () => void
  "data-testid"?: string
}) => (
  <button
    type="button"
    disabled={disabled || isLoading}
    onClick={onClick}
    data-testid={dataTestId}
    className="w-full py-[18px] px-[42px] rounded-[5px] border border-Charcoal bg-Gold text-Charcoal font-rexton text-h6 font-bold uppercase transition-opacity hover:opacity-95 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center text-center gap-[9px]"
  >
    {isLoading ? (
      <>
        <Spinner />
        PROCESSING...
      </>
    ) : (
      children
    )}
  </button>
)

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  cardComplete?: boolean
  savedPaymentMethodId?: string | null
  setupIntentClientSecret?: string | null
  "data-testid": string
}

const FINAL_CHARGE_CONSENT_VERSION = "catch-weight-final-charge-2026-05-31"
const FINAL_CHARGE_CONSENT_TEXT =
  "I agree that Griller's Pride will save my card today and charge the final order total when my order is packed and ready to leave."

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  cardComplete = false,
  savedPaymentMethodId,
  setupIntentClientSecret,
  "data-testid": dataTestId,
}) => {
  // All fulfillment types (including pickup) now set a shipping method on the cart
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  if (savedPaymentMethodId) {
    return (
      <SavedPaymentMethodButton
        notReady={notReady}
        cart={cart}
        savedPaymentMethodId={savedPaymentMethodId}
        data-testid={dataTestId}
      />
    )
  }

  if (setupIntentClientSecret) {
    return (
      <NewCardSetupPaymentButton
        notReady={notReady}
        cart={cart}
        cardComplete={cardComplete}
        setupIntentClientSecret={setupIntentClientSecret}
        data-testid={dataTestId}
      />
    )
  }

  return <GoldButton disabled>Select a payment method</GoldButton>
}

async function verifyAndPlaceOrder({
  cart,
  paymentMethodId,
  setupIntentId = null,
  setErrorMessage,
}: {
  cart: HttpTypes.StoreCart
  paymentMethodId: string
  setupIntentId?: string | null
  setErrorMessage: (message: string | null) => void
}) {
  await verifyCartInventoryForCheckout(cart.id)

  await placeOrderWithSavedPaymentMethod({
    paymentMethodId,
    setupIntentId,
    consentVersion: FINAL_CHARGE_CONSENT_VERSION,
    consentText: FINAL_CHARGE_CONSENT_TEXT,
  }).catch((err) => {
    setErrorMessage(err.message)
  })
}

const SavedPaymentMethodButton = ({
  cart,
  notReady,
  savedPaymentMethodId,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  savedPaymentMethodId: string
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const handlePayment = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)

    try {
      await verifyAndPlaceOrder({
        cart,
        paymentMethodId: savedPaymentMethodId,
        setErrorMessage,
      })
    } catch (err: any) {
      setErrorMessage(err.message || "Some items need inventory review.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-lg text-sm text-red-700">
          {errorMessage}. Please verify your payment details and try again.
        </div>
      )}
      <GoldButton
        disabled={notReady}
        onClick={handlePayment}
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place Order
      </GoldButton>
    </>
  )
}

const NewCardSetupPaymentButton = ({
  cart,
  notReady,
  cardComplete = false,
  setupIntentClientSecret,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  cardComplete?: boolean
  setupIntentClientSecret: string
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const disabled =
    !stripe || !elements || !card || !cardComplete || !setupIntentClientSecret

  const handlePayment = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)

    if (!cart || !stripe || !elements || !card) {
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    try {
      await verifyCartInventoryForCheckout(cart.id)
    } catch (err: any) {
      setErrorMessage(err.message || "Some items need inventory review.")
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    const result = await stripe!.confirmCardSetup(setupIntentClientSecret, {
      payment_method: {
        card: card!,
        billing_details: {
          name:
            cart.billing_address?.first_name +
            " " +
            cart.billing_address?.last_name,
          address: {
            city: cart.billing_address?.city ?? undefined,
            country: cart.billing_address?.country_code ?? undefined,
            line1: cart.billing_address?.address_1 ?? undefined,
            line2: cart.billing_address?.address_2 ?? undefined,
            postal_code: cart.billing_address?.postal_code ?? undefined,
            state: cart.billing_address?.province ?? undefined,
          },
          email: cart.email,
          phone: cart.billing_address?.phone ?? undefined,
        },
      },
    })

    if (result.error) {
      jitsuTrack("payment_setup_failed", {
        cart_id: cart.id,
        error_message: result.error.message,
        error_code: result.error.code,
        payment_type: "stripe_card_setup",
      })
      setErrorMessage(result.error.message || null)
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    const setupIntent = result.setupIntent
    const paymentMethodId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id

    if (
      !setupIntent?.id ||
      !paymentMethodId ||
      setupIntent.status !== "succeeded"
    ) {
      setErrorMessage("Card setup did not complete. Please try again.")
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    await placeOrderWithSavedPaymentMethod({
      paymentMethodId,
      setupIntentId: setupIntent.id,
      consentVersion: FINAL_CHARGE_CONSENT_VERSION,
      consentText: FINAL_CHARGE_CONSENT_TEXT,
    })
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        submittingRef.current = false
        setSubmitting(false)
      })
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-lg text-sm text-red-700">
          {errorMessage}. Please verify your payment details and try again.
        </div>
      )}
      <GoldButton
        disabled={disabled || notReady}
        onClick={handlePayment}
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Save Card & Place Order
      </GoldButton>
    </>
  )
}

export default PaymentButton

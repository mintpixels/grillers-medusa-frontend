"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripe } from "@lib/constants"
import {
  getStripePublishableKey,
  getStripeKeyMismatchWarning,
} from "@lib/util/stripe-key"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

// `getStripePublishableKey` picks the right key for the current
// VERCEL_ENV: live for production, test for everything else. Falls back
// to the legacy NEXT_PUBLIC_STRIPE_KEY when the new envs aren't set yet
// so existing deploys don't break during the migration (#63).
const stripeKey = getStripePublishableKey()
const stripePromise = stripeKey ? loadStripe(stripeKey) : null
const stripeMismatchWarning = getStripeKeyMismatchWarning(stripeKey)
if (stripeMismatchWarning && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(stripeMismatchWarning)
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const stripePaymentSession =
    isStripe(paymentSession?.provider_id) && paymentSession
      ? paymentSession
      : undefined

  if (stripePromise) {
    return (
      <StripeWrapper
        paymentSession={stripePaymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper

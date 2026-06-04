"use client"

import { Stripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { createContext } from "react"

type StripeWrapperProps = {
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  stripeKey,
  stripePromise,
  children,
}) => {
  if (!stripeKey) {
    throw new Error(
      "Stripe key is missing. Set NEXT_PUBLIC_STRIPE_KEY environment variable."
    )
  }

  if (!stripePromise) {
    throw new Error(
      "Stripe promise is missing. Make sure you have provided a valid Stripe key."
    )
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements stripe={stripePromise}>{children}</Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper

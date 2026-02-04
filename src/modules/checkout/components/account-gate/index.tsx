"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type AccountGateProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  onContinue: () => void
}

/**
 * Account gate component that requires users to log in or create an account
 * before proceeding to checkout. This is necessary for catch-weight billing
 * where the final charge may differ from the initial authorization.
 */
export default function AccountGate({
  cart,
  customer,
  onContinue,
}: AccountGateProps) {
  const router = useRouter()
  const countryCode = cart.region?.countries?.[0]?.iso_2 || "us"

  // If already logged in, just continue
  if (customer) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-Gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-Gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <Heading level="h2" className="text-2xl font-bold mb-2">
          Sign in to continue
        </Heading>
        <Text className="text-gray-600">
          Create an account or sign in to complete your order. This allows us to
          save your payment method for final billing.
        </Text>
      </div>

      {/* Explanation for why account is required */}
      <div className="bg-Gold/10 border border-Gold/30 rounded-lg p-4 mb-6 text-left">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-Gold mt-0.5"
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
              Why do I need an account?
            </p>
            <p className="text-sm text-Charcoal/70">
              Many of our products are sold by weight. Your card will be
              authorized for an estimated amount, and the final charge will be
              based on actual weights when your order is packed.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <LocalizedClientLink
          href={`/account?redirect=/checkout`}
          className="block"
        >
          <Button className="w-full" size="large">
            Sign in
          </Button>
        </LocalizedClientLink>

        <LocalizedClientLink
          href={`/account?redirect=/checkout&mode=register`}
          className="block"
        >
          <Button className="w-full" variant="secondary" size="large">
            Create account
          </Button>
        </LocalizedClientLink>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        By creating an account, you agree to our{" "}
        <LocalizedClientLink
          href="/terms"
          className="text-Gold hover:text-Gold/80 underline"
        >
          Terms of Service
        </LocalizedClientLink>{" "}
        and{" "}
        <LocalizedClientLink
          href="/privacy"
          className="text-Gold hover:text-Gold/80 underline"
        >
          Privacy Policy
        </LocalizedClientLink>
        .
      </p>
    </div>
  )
}

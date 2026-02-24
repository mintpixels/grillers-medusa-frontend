"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"

type CheckoutAuthProps = {
  customer: HttpTypes.StoreCustomer | null
  email: string
  onEmailChange: (email: string) => void
  onLoginSuccess: () => void
}

const CheckoutAuth: React.FC<CheckoutAuthProps> = ({ customer }) => {
  if (!customer) return null

  return (
    <div className="mb-5 p-4 bg-Scroll/30 border border-Gold/20 rounded-lg">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-Gold" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-Charcoal">
          Signed in as{" "}
          <span className="font-semibold">
            {customer.first_name} {customer.last_name}
          </span>
        </p>
      </div>
    </div>
  )
}

export default CheckoutAuth

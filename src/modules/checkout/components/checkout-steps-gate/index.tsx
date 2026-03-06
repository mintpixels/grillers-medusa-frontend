"use client"

import { type ReactNode } from "react"
import { useFulfillmentEdit } from "@modules/checkout/context/fulfillment-edit-context"

export default function CheckoutStepsGate({ children }: { children: ReactNode }) {
  const { isEditingFulfillment } = useFulfillmentEdit()

  if (isEditingFulfillment) return null

  return <>{children}</>
}

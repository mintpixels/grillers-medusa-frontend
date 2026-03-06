"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type FulfillmentEditContextValue = {
  isEditingFulfillment: boolean
  setIsEditingFulfillment: (editing: boolean) => void
}

const FulfillmentEditContext = createContext<FulfillmentEditContextValue>({
  isEditingFulfillment: false,
  setIsEditingFulfillment: () => {},
})

export function FulfillmentEditProvider({ children }: { children: ReactNode }) {
  const [isEditingFulfillment, setIsEditingFulfillment] = useState(false)

  return (
    <FulfillmentEditContext.Provider value={{ isEditingFulfillment, setIsEditingFulfillment }}>
      {children}
    </FulfillmentEditContext.Provider>
  )
}

export function useFulfillmentEdit() {
  return useContext(FulfillmentEditContext)
}

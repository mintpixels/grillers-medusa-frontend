import type { HttpTypes } from "@medusajs/types"

export type StorefrontSessionCustomer = {
  id: string
  firstName: string | null
  initials: string | null
  canUseStaffTools: boolean
  defaultShippingProvince: string | null
}

export type StorefrontSessionStaffImpersonation = {
  staffName: string
  targetName: string
} | null

export type StorefrontSessionDeliveryZipSource =
  | "cart"
  | "address"
  | "saved"
  | null

export type StorefrontSessionSnapshot = {
  customer: StorefrontSessionCustomer | null
  staffImpersonation: StorefrontSessionStaffImpersonation
  cart: HttpTypes.StoreCart | null
  cartItemCount: number
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  deliveryZip: string | null
  deliveryZipSource: StorefrontSessionDeliveryZipSource
}

export type StorefrontSessionState = StorefrontSessionSnapshot & {
  loaded: boolean
  refreshing: boolean
}

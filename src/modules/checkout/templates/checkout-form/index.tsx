import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Shipping from "@modules/checkout/components/shipping"
import FulfillmentStep from "@modules/checkout/components/fulfillment-step"
import type { FulfillmentType } from "@lib/data/cart"
import type { FulfillmentConfigData } from "@lib/data/strapi/checkout"

/**
 * Determines if shipping method selection is needed.
 * For pre-selected fulfillment (plant_pickup, atlanta_delivery, southeast_pickup),
 * we skip the shipping method step as it's determined by the fulfillment selection.
 */
function needsShippingMethodSelection(cart: HttpTypes.StoreCart): boolean {
  const fulfillmentType = cart.metadata?.fulfillmentType as FulfillmentType | undefined
  // Only UPS shipping needs the traditional shipping method selection
  return fulfillmentType === "ups_shipping"
}

export default async function CheckoutForm({
  cart,
  customer,
  fulfillmentConfig,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  fulfillmentConfig: FulfillmentConfigData["checkout"]
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  const showShippingMethodSelection = needsShippingMethodSelection(cart)

  return (
    <div className="w-full grid grid-cols-1 gap-y-6">
      {/* Step 1: Fulfillment selection/summary - always in yellow box */}
      <FulfillmentStep cart={cart} customer={customer} config={fulfillmentConfig} />

      {/* Step 2: Address section - always shown for contact info */}
      <Addresses cart={cart} customer={customer} />

      {/* Shipping method selection - only for UPS shipping */}
      {showShippingMethodSelection && (
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      )}

      {/* Step 3: Payment section with Place Order */}
      <Payment cart={cart} availablePaymentMethods={paymentMethods} />
    </div>
  )
}

"use client"

import { setAddresses } from "@lib/data/cart"
import type { FulfillmentType } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { trackBeginCheckout } from "@lib/gtm"
import { HttpTypes } from "@medusajs/types"
import { useToggleState } from "@medusajs/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect, useRef } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if this is a pickup order (no shipping address needed)
  const fulfillmentType = cart?.metadata?.fulfillmentType as FulfillmentType | undefined
  const isPickup = fulfillmentType === "plant_pickup" || fulfillmentType === "southeast_pickup"

  // Check if address is already filled
  const hasRequiredAddress = isPickup
    ? !!(cart?.shipping_address?.first_name || cart?.billing_address?.first_name)
    : !!(cart?.shipping_address?.first_name && cart?.shipping_address?.address_1)

  // Auto-open if address not filled, or if explicitly set via URL
  const isOpen = searchParams.get("step") === "address" || !hasRequiredAddress

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  // Track begin_checkout event once on component mount
  const hasTrackedCheckout = useRef(false)
  useEffect(() => {
    if (cart && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true
      trackBeginCheckout({
        id: cart.id,
        total: (cart.total || 0) / 100,
        currency: cart.currency_code?.toUpperCase(),
        items: cart.items?.map(item => ({
          id: item.product_id || item.id,
          title: item.product_title || '',
          price: (item.unit_price || 0) / 100,
          quantity: item.quantity,
        })) || [],
      })
    }
  }, [cart])

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  // For pickup orders, we show a simplified form
  if (isPickup) {
    const hasAddress = cart?.billing_address || cart?.shipping_address

    return (
      <div>
        {/* Step header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-Gold text-white text-sm font-semibold">
              2
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Contact & Billing</h2>
            {!isOpen && hasAddress && (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {!isOpen && hasAddress && (
            <button
              onClick={handleEdit}
              className="text-sm text-Gold hover:text-Gold/80 font-medium"
              data-testid="edit-address-button"
            >
              Edit
            </button>
          )}
        </div>

        {isOpen ? (
          <form action={formAction}>
            <p className="text-sm text-gray-500 mb-5">
              We just need your contact details and billing information for payment.
            </p>
            
            <ShippingAddress
              customer={customer}
              checked={true}
              onChange={() => {}}
              cart={cart}
              isPickupOrder={true}
            />
            
            <SubmitButton className="mt-5" data-testid="submit-address-button">
              Continue to payment
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </form>
        ) : (
          <div>
            {cart && hasAddress ? (
              <div className="grid grid-cols-2 gap-6">
                <div data-testid="contact-summary">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                  <p className="text-sm text-gray-900">
                    {cart.shipping_address?.first_name || cart.billing_address?.first_name}{" "}
                    {cart.shipping_address?.last_name || cart.billing_address?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{cart.email}</p>
                  <p className="text-sm text-gray-600">
                    {cart.shipping_address?.phone || cart.billing_address?.phone}
                  </p>
                </div>

                <div data-testid="billing-address-summary">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Billing Address</p>
                  <p className="text-sm text-gray-600">
                    {cart.billing_address?.address_1 || cart.shipping_address?.address_1}
                  </p>
                  <p className="text-sm text-gray-600">
                    {cart.billing_address?.city || cart.shipping_address?.city},{" "}
                    {cart.billing_address?.province || cart.shipping_address?.province}{" "}
                    {cart.billing_address?.postal_code || cart.shipping_address?.postal_code}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
          </div>
        )}
        
        <div className="border-b border-gray-200 mt-6" />
      </div>
    )
  }

  // For delivery orders (atlanta_delivery, ups_shipping), show full shipping + billing
  return (
    <div>
      {/* Step header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-Gold text-white text-sm font-semibold">
            2
          </span>
          <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
          {!isOpen && cart?.shipping_address && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {!isOpen && cart?.shipping_address && (
          <button
            onClick={handleEdit}
            className="text-sm text-Gold hover:text-Gold/80 font-medium"
            data-testid="edit-address-button"
          >
            Edit
          </button>
        )}
      </div>

      {isOpen ? (
        <form action={formAction}>
          <ShippingAddress
            customer={customer}
            checked={sameAsBilling}
            onChange={toggleSameAsBilling}
            cart={cart}
          />

          {!sameAsBilling && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Billing Address
              </h3>
              <BillingAddress cart={cart} />
            </div>
          )}
          
          <SubmitButton className="mt-5" data-testid="submit-address-button">
            Continue to payment
          </SubmitButton>
          <ErrorMessage error={message} data-testid="address-error-message" />
        </form>
      ) : (
        <div>
          {cart && cart.shipping_address ? (
            <div className="grid grid-cols-3 gap-4">
              <div data-testid="shipping-address-summary">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Shipping</p>
                <p className="text-sm text-gray-900">
                  {cart.shipping_address.first_name} {cart.shipping_address.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  {cart.shipping_address.address_1}
                </p>
                <p className="text-sm text-gray-600">
                  {cart.shipping_address.city}, {cart.shipping_address.postal_code}
                </p>
              </div>

              <div data-testid="shipping-contact-summary">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                <p className="text-sm text-gray-600">{cart.email}</p>
                <p className="text-sm text-gray-600">{cart.shipping_address.phone}</p>
              </div>

              <div data-testid="billing-address-summary">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Billing</p>
                {sameAsBilling ? (
                  <p className="text-sm text-gray-600">Same as shipping</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      {cart.billing_address?.address_1}
                    </p>
                    <p className="text-sm text-gray-600">
                      {cart.billing_address?.city}, {cart.billing_address?.postal_code}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
        </div>
      )}
      
      <div className="border-b border-gray-200 mt-6" />
    </div>
  )
}

export default Addresses

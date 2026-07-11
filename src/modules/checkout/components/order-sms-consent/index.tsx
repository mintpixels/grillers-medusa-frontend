"use client"

import { setOrderSmsConsent } from "@lib/data/cart"
import {
  isCurrentOrderSmsConsent,
  ORDER_SMS_DISCLOSURE,
} from "@lib/util/order-sms-consent"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useRef, useState } from "react"

type OrderSmsConsentProps = {
  cart: any
  controlsDisabled?: boolean
  children: (state: { orderPlacementBlocked: boolean }) => React.ReactNode
}

function isGrantedConsent(value: unknown) {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).granted === true
  )
}

const OrderSmsConsent = ({
  cart,
  controlsDisabled = false,
  children,
}: OrderSmsConsentProps) => {
  const phone = String(cart?.shipping_address?.phone || "").trim()
  const fulfillmentType = String(
    cart?.metadata?.fulfillmentType || cart?.metadata?.fulfillment_type || ""
  ).trim()
  const isUpsShipping = fulfillmentType === "ups_shipping"
  const storedConsent = cart?.metadata?.order_sms_consent
  const storedConsentIsCurrent =
    isUpsShipping && isCurrentOrderSmsConsent(storedConsent, phone)
  const staleGrantedConsent =
    isGrantedConsent(storedConsent) && !storedConsentIsCurrent

  const [checked, setChecked] = useState(storedConsentIsCurrent)
  const [pending, setPending] = useState(staleGrantedConsent)
  const [orderPlacementBlocked, setOrderPlacementBlocked] =
    useState(staleGrantedConsent)
  const [staleGrantCleared, setStaleGrantCleared] = useState(
    !staleGrantedConsent
  )
  const [error, setError] = useState<string | null>(null)
  const resetScope = useRef<string | null>(null)
  const previousCartScope = useRef(
    `${cart?.id || ""}:${phone}:${fulfillmentType}`
  )

  const isStaffCart = Boolean(
    cart?.metadata?.staff_impersonation ||
      cart?.metadata?.staff_target_customer_id ||
      cart?.metadata?.source === "staff_impersonation"
  )

  // If the fulfillment phone or consent contract changed, fail closed by
  // replacing the old granted object before order placement can continue.
  useEffect(() => {
    const scope = `${cart?.id || ""}:${phone}:${fulfillmentType}`
    if (previousCartScope.current !== scope) {
      previousCartScope.current = scope
      resetScope.current = null
      setChecked(storedConsentIsCurrent)
      setPending(staleGrantedConsent)
      setOrderPlacementBlocked(staleGrantedConsent)
      setStaleGrantCleared(!staleGrantedConsent)
      setError(null)
    }

    if (!staleGrantedConsent || isStaffCart || resetScope.current === scope) {
      return
    }

    resetScope.current = scope
    setChecked(false)
    setPending(true)
    setOrderPlacementBlocked(true)
    setError(null)

    void setOrderSmsConsent({ cartId: cart.id, granted: false })
      .then(() => {
        setPending(false)
        setStaleGrantCleared(true)
        setOrderPlacementBlocked(false)
      })
      .catch(() => {
        setPending(false)
        setOrderPlacementBlocked(true)
        setError(
          "We couldn’t remove the previous order-text choice. Try again before placing your order."
        )
      })
  }, [
    cart?.id,
    phone,
    fulfillmentType,
    staleGrantedConsent,
    storedConsentIsCurrent,
    isStaffCart,
  ])

  if (isStaffCart) {
    return <>{children({ orderPlacementBlocked: false })}</>
  }

  // Prop changes render before effects run. Include a newly detected stale
  // grant in the rendered gate immediately so there is no one-frame window in
  // which Place Order can be clicked with an old fulfillment phone.
  const currentCartScope = `${cart?.id || ""}:${phone}:${fulfillmentType}`
  const unresolvedStaleGrant =
    staleGrantedConsent &&
    (previousCartScope.current !== currentCartScope || !staleGrantCleared)
  const effectiveOrderPlacementBlocked =
    orderPlacementBlocked || unresolvedStaleGrant
  const effectiveChecked = unresolvedStaleGrant ? false : checked

  const saveChoice = async (nextChecked: boolean) => {
    const previousChecked = checked
    setChecked(nextChecked)
    setPending(true)
    setOrderPlacementBlocked(true)
    setError(null)

    try {
      await setOrderSmsConsent({ cartId: cart.id, granted: nextChecked })
      setPending(false)
      setOrderPlacementBlocked(false)
    } catch {
      setChecked(previousChecked)
      setPending(false)

      if (nextChecked) {
        // A failed opt-in leaves texts off, so checkout may safely continue.
        setOrderPlacementBlocked(false)
        setError(
          "We couldn’t turn on order texts. They remain off, and you can still place your order."
        )
      } else {
        // A failed opt-out may leave a granted object on the cart. Keep order
        // placement blocked until the customer successfully retries.
        setOrderPlacementBlocked(true)
        setError(
          "We couldn’t turn off order texts. Try again before placing your order."
        )
      }
    }
  }

  if (!isUpsShipping) {
    return (
      <>
        {effectiveOrderPlacementBlocked && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p
              className="text-xs text-amber-800"
              role={error ? "alert" : "status"}
            >
              {error || "Removing the previous UPS shipping-text choice…"}
            </p>
            {error && (
              <button
                className="mt-2 text-xs font-semibold text-Gold underline"
                disabled={pending}
                onClick={() => void saveChoice(false)}
                type="button"
              >
                Try again
              </button>
            )}
          </div>
        )}
        {children({ orderPlacementBlocked: effectiveOrderPlacementBlocked })}
      </>
    )
  }

  return (
    <>
      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-sm font-semibold text-gray-900">
          UPS shipping and tracking texts (optional)
        </p>
        <label className="flex items-start gap-3">
          <input
            checked={effectiveChecked}
            className="mt-1 h-4 w-4 shrink-0 accent-Gold"
            data-testid="order-sms-consent"
            disabled={
              pending || unresolvedStaleGrant || controlsDisabled || !phone
            }
            onChange={(event) => void saveChoice(event.target.checked)}
            type="checkbox"
          />
          <span className="text-xs leading-relaxed text-gray-600">
            {ORDER_SMS_DISCLOSURE}
          </span>
        </label>
        <p className="mt-2 text-xs text-gray-500">
          <LocalizedClientLink
            href="/page/order-sms-terms"
            className="underline hover:text-Gold"
          >
            SMS Terms
          </LocalizedClientLink>{" "}
          ·{" "}
          <LocalizedClientLink
            href="/page/order-sms-privacy"
            className="underline hover:text-Gold"
          >
            Privacy Policy
          </LocalizedClientLink>
        </p>
        {!phone && (
          <p className="mt-2 text-xs text-amber-700">
            Add a phone number to your fulfillment address to turn on order
            texts.
          </p>
        )}
        {pending && (
          <p className="mt-2 text-xs text-gray-500" role="status">
            Saving your order-text choice…
          </p>
        )}
        {error && (
          <div className="mt-2 flex items-start justify-between gap-3">
            <p className="text-xs text-red-700" role="alert">
              {error}
            </p>
            {effectiveOrderPlacementBlocked && (
              <button
                className="shrink-0 text-xs font-semibold text-Gold underline"
                disabled={pending}
                onClick={() => void saveChoice(false)}
                type="button"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      {children({ orderPlacementBlocked: effectiveOrderPlacementBlocked })}
    </>
  )
}

export default OrderSmsConsent

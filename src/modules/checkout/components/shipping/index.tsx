"use client"

import { RadioGroup, Radio } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { trackAddShippingInfo } from "@lib/gtm"

import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import ArriveFoodCalendar from "../arrival-calendar"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const RadioDot: React.FC<{ checked: boolean }> = ({ checked }) => (
  <div
    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
      checked ? "border-Gold" : "border-gray-300"
    }`}
  >
    {checked && <div className="w-2 h-2 rounded-full bg-Gold" />}
  </div>
)

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Check if address step is complete
  const addressComplete = !!(cart?.shipping_address?.first_name && cart?.shipping_address?.address_1)
  
  // Check if shipping method has been selected
  const shippingMethodSelected = (cart.shipping_methods?.length ?? 0) > 0

  // Auto-open if: address is done AND no shipping method yet, OR explicitly via URL
  const isOpen = searchParams.get("step") === "delivery" || (addressComplete && !shippingMethodSelected)

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
  )

  const fulfillmentType = cart.metadata?.fulfillmentType as string | undefined
  const showPickupSection = fulfillmentType !== "ups_shipping"
  const hasPickupOptions = !!_pickupMethods?.length && showPickupSection

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }


  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .then(() => {
        const selectedMethod = availableShippingMethods?.find(m => m.id === id)
        trackAddShippingInfo({
          total: (cart.total || 0) / 100,
          currency: cart.currency_code?.toUpperCase(),
          shippingTier: selectedMethod?.name,
          items: cart.items?.map(item => ({
            id: item.product_id || item.id,
            title: item.product_title || '',
            price: (item.unit_price || 0) / 100,
            quantity: item.quantity,
          })) || [],
        })
        router.refresh()
      })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const isIncomplete = !isOpen && cart.shipping_methods?.length === 0

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-3 ${isIncomplete ? "opacity-50 pointer-events-none select-none" : ""}`}>
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-Gold text-white text-sm font-semibold">
            3
          </span>
          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Options
          </h2>
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <button
              onClick={handleEdit}
              className="text-sm text-Gold hover:text-Gold/80 font-medium"
              data-testid="edit-delivery-button"
            >
              Edit
            </button>
          )}
      </div>

      {isOpen ? (
        <>
          <div>
            <div className="flex flex-col mb-3">
              <span className="text-sm font-medium text-gray-700">
                Shipping method
              </span>
              <span className="text-sm text-gray-500">
                How would you like your order delivered
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-6">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(value) => {
                      const id = _pickupMethods.find(
                        (option) => !option.insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={`flex items-center justify-between cursor-pointer border rounded-lg px-4 py-3 mb-2 transition-colors ${
                        showPickupOptions === PICKUP_OPTION_ON
                          ? "border-Gold bg-Gold/5"
                          : "border-gray-200 hover:border-Gold/50"
                      }`}
                    >
                      <div className="flex items-center gap-x-3">
                        <RadioDot checked={showPickupOptions === PICKUP_OPTION_ON} />
                        <span className="text-sm text-gray-900">Local Pick Up</span>
                      </div>
                      <span className="text-sm text-gray-500">-</span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => handleSetShippingMethod(v, "shipping")}
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"

                    return (
                      calculatedPricesMap[option.id] > -10 && (
                        <Radio
                          key={option.id}
                          value={option.id}
                          data-testid="delivery-option-radio"
                          disabled={isDisabled}
                          className={`flex items-center justify-between cursor-pointer border rounded-lg px-4 py-3 mb-2 transition-colors ${
                            option.id === shippingMethodId
                              ? "border-Gold bg-Gold/5"
                              : "border-gray-200 hover:border-Gold/50"
                          } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-x-3">
                            <RadioDot checked={option.id === shippingMethodId} />
                            <span className="text-sm text-gray-900">
                              {option.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {option.price_type === "flat" ? (
                              convertToLocale({
                                amount: option.amount!,
                                currency_code: cart?.currency_code,
                              })
                            ) : calculatedPricesMap[option.id] ? (
                              convertToLocale({
                                amount: calculatedPricesMap[option.id],
                                currency_code: cart?.currency_code,
                              })
                            ) : isLoadingPrices ? (
                              <span className="w-4 h-4 border-2 border-gray-300 border-t-Gold rounded-full animate-spin inline-block" />
                            ) : (
                              "-"
                            )}
                          </span>
                        </Radio>
                      )
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div>
              <div className="flex flex-col mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Store
                </span>
                <span className="text-sm text-gray-500">
                  Choose a store near you
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-6">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => handleSetShippingMethod(v, "pickup")}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={`flex items-center justify-between cursor-pointer border rounded-lg px-4 py-3 mb-2 transition-colors ${
                            option.id === shippingMethodId
                              ? "border-Gold bg-Gold/5"
                              : "border-gray-200 hover:border-Gold/50"
                          } ${option.insufficient_inventory ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-start gap-x-3">
                            <RadioDot checked={option.id === shippingMethodId} />
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">
                                {option.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatAddress(
                                  option.service_zone?.fulfillment_set?.location
                                    ?.address
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {shippingMethodId && showPickupOptions === PICKUP_OPTION_OFF && (
            <div>
              <div className="flex flex-col mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Shipment
                </span>
                <span className="text-sm text-gray-500">
                  When do you want the food to arrive?
                </span>
              </div>
              <div data-testid="shipment-options-container">
                <div className="pb-6">
                  <div className="flex items-start gap-x-1 w-full">
                    <div className="w-2/5">
                      <ArriveFoodCalendar cart={cart} setError={setError} />
                    </div>
                    <div className="w-3/5 flex flex-col gap-y-2 pt-8 pl-12">
                      <span className="text-sm font-normal text-gray-400">
                        Not Available
                      </span>
                      <span className="text-sm font-normal text-gray-500 pt-10">
                        *This is an estimate and specific days are not guaranteed.
                        We do not control the world's logistic systems.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          {shippingMethodId && (
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  router.replace(pathname + "?step=payment", { scroll: false })
                  router.refresh()
                }}
                className="px-8 h-11 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid="submit-delivery-button"
              >
                Continue to payment
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Method
                </p>
                <p className="text-sm text-gray-600">
                  {cart.shipping_methods?.at(-1)?.name}{" "}
                  {convertToLocale({
                    amount: cart.shipping_methods.at(-1)?.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-b border-gray-200 mt-6" />
    </div>
  )
}

export default Shipping

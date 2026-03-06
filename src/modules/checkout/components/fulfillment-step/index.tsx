"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { setFulfillmentDetails, setShippingMethod, type FulfillmentType } from "@lib/data/cart"
import { findShippingOptionByType } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import type { FulfillmentConfigData, PickupCreditConfig } from "@lib/data/strapi/checkout"
import PlantPickupScheduling from "@modules/checkout/components/fulfillment-selector/scheduling/plant-pickup"
import SoutheastPickupScheduling from "@modules/checkout/components/fulfillment-selector/scheduling/southeast-pickup"

type FulfillmentStepProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  config: FulfillmentConfigData["checkout"]
  availableFulfillmentTypes: FulfillmentType[]
  pickupCreditConfig: PickupCreditConfig
}

const TruckIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const DeliveryIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const PlantIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const fulfillmentLabels: Record<FulfillmentType, { label: string; description: string }> = {
  ups_shipping: {
    label: "UPS Shipping",
    description: "Nationwide delivery via UPS. Your order will be packed in insulated containers to ensure freshness.",
  },
  atlanta_delivery: {
    label: "Local Delivery",
    description: "Fresh delivery to your door within the Atlanta metro area.",
  },
  plant_pickup: {
    label: "Plant Pickup",
    description: "Pick up your order at our Atlanta facility. Please bring a valid ID.",
  },
  southeast_pickup: {
    label: "Regional Pickup",
    description: "Collect your order from a partner pickup location in the Southeast.",
  },
}

type SubStep = "select" | "plant_date" | "southeast_pickup"

export default function FulfillmentStep({ cart, customer, config, availableFulfillmentTypes, pickupCreditConfig }: FulfillmentStepProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subStep, setSubStep] = useState<SubStep>("select")
  const [pendingPickupDate, setPendingPickupDate] = useState("")
  const [pendingSELocationId, setPendingSELocationId] = useState("")
  const [pendingSEDate, setPendingSEDate] = useState("")

  const attachShippingMethod = async (type: FulfillmentType) => {
    if (type === "ups_shipping") return
    const option = await findShippingOptionByType(cart.id, type)
    if (option) {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: option.id })
    }
  }

  const rawFulfillmentType = cart.metadata?.fulfillmentType as string | undefined
  const fulfillmentType = rawFulfillmentType && rawFulfillmentType.length > 0 ? rawFulfillmentType as FulfillmentType : undefined
  const scheduledDate = cart.metadata?.scheduledDate as string | undefined
  const hasFulfillment = Boolean(fulfillmentType)

  const showSelection = !hasFulfillment || isEditing

  const cartTotal = cart.total || 0
  const cartSubtotal = cart.subtotal || 0

  const normalizeMinimum = (value: number | undefined, defaultValue: number): number => {
    if (value === undefined || value === null) return defaultValue
    return value > 500 ? value / 100 : value
  }

  const minimums = useMemo(() => ({
    upsShipping: normalizeMinimum(config?.MinimumOrderThresholds?.UPSShipping, 40),
    atlantaDelivery: normalizeMinimum(config?.MinimumOrderThresholds?.AtlantaDelivery, 100),
    plantPickup: normalizeMinimum(config?.MinimumOrderThresholds?.PlantPickup, 0),
    southeastPickup: normalizeMinimum(config?.MinimumOrderThresholds?.SoutheastPickup, 0),
  }), [config])

  const availability = useMemo(() => ({
    upsShipping: cartTotal >= minimums.upsShipping,
    upsAmountAway: Math.max(0, minimums.upsShipping - cartTotal),
    atlantaDelivery: cartTotal >= minimums.atlantaDelivery,
    atlantaDeliveryAmountAway: Math.max(0, minimums.atlantaDelivery - cartTotal),
    plantPickup: cartTotal >= minimums.plantPickup,
    plantPickupAmountAway: Math.max(0, minimums.plantPickup - cartTotal),
    southeastPickup: cartTotal >= minimums.southeastPickup,
    southeastAmountAway: Math.max(0, minimums.southeastPickup - cartTotal),
  }), [cartTotal, minimums])

  const pickupCreditQualifies = cartSubtotal >= pickupCreditConfig.threshold
  const pickupCreditAmountAway = Math.max(0, pickupCreditConfig.threshold - cartSubtotal)

  const allOptions = [
    {
      id: "ups_shipping" as FulfillmentType,
      title: "Ship to Me",
      subtitle: "Continental US delivery via UPS",
      icon: <TruckIcon />,
      available: availability.upsShipping,
      amountAway: availability.upsAmountAway,
    },
    {
      id: "atlanta_delivery" as FulfillmentType,
      title: "Atlanta Metro Delivery",
      subtitle: "Local delivery to your door",
      icon: <DeliveryIcon />,
      available: availability.atlantaDelivery,
      amountAway: availability.atlantaDeliveryAmountAway,
    },
    {
      id: "plant_pickup" as FulfillmentType,
      title: "Plant Pickup",
      subtitle: config?.PlantPickupCity ? `${config.PlantPickupCity}, ${config.PlantPickupState}` : "Atlanta, GA",
      icon: <PlantIcon />,
      available: availability.plantPickup,
      amountAway: availability.plantPickupAmountAway,
    },
    {
      id: "southeast_pickup" as FulfillmentType,
      title: "Southeast Pickup",
      subtitle: "Pick up at a location near you",
      icon: <MapPinIcon />,
      available: availability.southeastPickup,
      amountAway: availability.southeastAmountAway,
    },
  ]

  const options = availableFulfillmentTypes.length > 0
    ? allOptions.filter(opt => availableFulfillmentTypes.includes(opt.id))
    : allOptions

  const handleSelectOption = async (option: FulfillmentType) => {
    if (isSubmitting) return

    if (option === "plant_pickup") {
      setPendingPickupDate("")
      setSubStep("plant_date")
      return
    }

    if (option === "southeast_pickup") {
      setPendingSELocationId("")
      setPendingSEDate("")
      setSubStep("southeast_pickup")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

      await setFulfillmentDetails({
        cartId: cart.id,
        fulfillmentType: option,
        fulfillmentZip: option === "atlanta_delivery" ? "" : "00000",
        scheduledDate: today,
      })

      await attachShippingMethod(option)

      setIsEditing(false)
      setSubStep("select")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to set fulfillment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmPickupDate = async () => {
    if (isSubmitting || !pendingPickupDate) return

    setIsSubmitting(true)
    setError(null)

    try {
      await setFulfillmentDetails({
        cartId: cart.id,
        fulfillmentType: "plant_pickup",
        fulfillmentZip: "00000",
        scheduledDate: pendingPickupDate,
      })

      await attachShippingMethod("plant_pickup")

      setIsEditing(false)
      setSubStep("select")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to set fulfillment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmSoutheastPickup = async () => {
    if (isSubmitting || !pendingSELocationId || !pendingSEDate) return

    setIsSubmitting(true)
    setError(null)

    try {
      await setFulfillmentDetails({
        cartId: cart.id,
        fulfillmentType: "southeast_pickup",
        fulfillmentZip: "00000",
        scheduledDate: pendingSEDate,
        pickupLocationId: pendingSELocationId,
      })

      await attachShippingMethod("southeast_pickup")

      setIsEditing(false)
      setSubStep("select")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to set fulfillment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = () => {
    if (isEditing) {
      setIsEditing(false)
      setSubStep("select")
    } else {
      setError(null)
      setIsEditing(true)
      setSubStep("select")
    }
  }

  return (
    <div className="bg-gradient-to-r from-Gold/20 to-Gold/10 border border-Gold/30 rounded-xl p-5">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-Gold text-white text-xs font-bold">
            1
          </span>
          <span className="text-sm font-medium text-Charcoal">Fulfillment Method</span>
          {hasFulfillment && !isEditing && (
            <svg className="w-4 h-4 text-green-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {hasFulfillment && (
          <button
            type="button"
            onClick={handleChange}
            disabled={isSubmitting}
            className="flex items-center gap-1 text-sm text-Gold hover:text-Gold/80 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "..." : isEditing ? "Cancel" : "Change"}
            {!isEditing && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Selection Mode */}
      {showSelection && subStep === "select" && (
        <div>
          <h2 className="text-lg font-semibold text-Charcoal mb-1">
            How would you like to receive your order?
          </h2>
          <p className="text-sm text-Charcoal/70 mb-4">
            Select your preferred fulfillment method.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => option.available && handleSelectOption(option.id)}
                disabled={!option.available || isSubmitting}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all bg-white
                  ${option.available && !isSubmitting
                    ? "border-gray-200 hover:border-Gold hover:shadow-sm cursor-pointer" 
                    : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                  }
                `}
              >
                <div className="flex flex-col">
                  <div className={`mb-2 ${option.available ? "text-Charcoal" : "text-gray-400"}`}>
                    {option.icon}
                  </div>
                  <h3 className={`font-medium text-sm ${option.available ? "text-Charcoal" : "text-gray-500"}`}>
                    {option.title}
                  </h3>
                  <p className={`text-xs mt-0.5 ${option.available ? "text-Charcoal/60" : "text-gray-400"}`}>
                    {option.subtitle}
                  </p>

                  {/* Plant pickup credit teaser */}
                  {option.id === "plant_pickup" && option.available && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      {pickupCreditQualifies
                        ? `${convertToLocale({ amount: pickupCreditConfig.creditAmount, currency_code: cart.currency_code })} pickup credit!`
                        : `Add ${convertToLocale({ amount: pickupCreditAmountAway, currency_code: cart.currency_code })} more for a ${convertToLocale({ amount: pickupCreditConfig.creditAmount, currency_code: cart.currency_code })} credit`
                      }
                    </p>
                  )}
                  
                  {!option.available && option.amountAway > 0 && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      Add {convertToLocale({ amount: option.amountAway, currency_code: cart.currency_code })} more to qualify
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Plant Pickup Date Selection Sub-step */}
      {showSelection && subStep === "plant_date" && (
        <PlantPickupScheduling
          config={config}
          selectedDate={pendingPickupDate}
          onDateChange={setPendingPickupDate}
          onConfirm={handleConfirmPickupDate}
          onBack={() => setSubStep("select")}
        />
      )}

      {/* Southeast Pickup Location/Date Sub-step */}
      {showSelection && subStep === "southeast_pickup" && (
        <SoutheastPickupScheduling
          locations={config.SoutheastPickupLocations?.map((loc) => ({
            ...loc,
            IsActive: true,
          })) || []}
          selectedLocationId={pendingSELocationId}
          selectedDate={pendingSEDate}
          onLocationChange={setPendingSELocationId}
          onDateChange={setPendingSEDate}
          onConfirm={handleConfirmSoutheastPickup}
          onBack={() => setSubStep("select")}
        />
      )}

      {/* Summary Mode */}
      {!showSelection && fulfillmentType && (
        <div className="flex items-start gap-4">
          <div className="p-3 bg-Gold rounded-xl text-white shadow-sm">
            {options.find(o => o.id === fulfillmentType)?.icon}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-Charcoal mb-1">
              {fulfillmentLabels[fulfillmentType].label}
            </h3>
            
            {scheduledDate && (
              <div className="flex items-center gap-2 text-sm text-Charcoal/80 mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{scheduledDate}</span>
              </div>
            )}
            
            <p className="text-sm text-Charcoal/70 leading-relaxed">
              {fulfillmentLabels[fulfillmentType].description}
            </p>

            {/* Southeast pickup location summary */}
            {fulfillmentType === "southeast_pickup" && cart.metadata?.pickupLocationId && (
              <div className="mt-2 text-sm text-Charcoal/80">
                <span className="font-medium">Location: </span>
                {config.SoutheastPickupLocations?.find(
                  (l) => l.id === cart.metadata?.pickupLocationId
                )?.Name || cart.metadata.pickupLocationId}
              </div>
            )}

            {/* Pickup credit confirmation */}
            {fulfillmentType === "plant_pickup" && pickupCreditQualifies && (
              <p className="text-sm text-green-600 font-medium mt-2">
                {convertToLocale({ amount: pickupCreditConfig.creditAmount, currency_code: cart.currency_code })} pickup credit applied!
              </p>
            )}

            {/* Post-order note preview for plant pickup */}
            {fulfillmentType === "plant_pickup" && config.PlantPickupPostOrderNote && (
              <div className="mt-3 bg-Gold/5 border border-Gold/20 rounded-lg p-3">
                <p className="text-xs text-Charcoal/70">
                  {config.PlantPickupPostOrderNote}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

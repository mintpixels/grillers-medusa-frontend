"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { setFulfillmentDetails, setShippingMethod, type FulfillmentType } from "@lib/data/cart"
import { findPickupOption } from "@lib/data/fulfillment"
import type { FulfillmentConfigData } from "@lib/data/strapi/checkout"
import { convertToLocale } from "@lib/util/money"
import AddressForm, { type DeliveryAddress } from "./address-form"
import PlantPickupScheduling from "./scheduling/plant-pickup"
import AtlantaDeliveryScheduling from "./scheduling/atlanta-delivery"
import UPSShippingScheduling from "./scheduling/ups-shipping"
import SoutheastPickupScheduling from "./scheduling/southeast-pickup"

type FulfillmentSelectorProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  config: FulfillmentConfigData["checkout"] | null
}

type Step =
  | "select"
  | "address"
  | "location"
  | "schedule"

type SelectedOption = FulfillmentType | null

// Icons for each option
const TruckIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M15 17h.01M9 12h6m-6-4h6M5 8h14l1 8H4l1-8zM7 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const DeliveryIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const PlantIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function FulfillmentSelector({
  cart,
  customer,
  config,
}: FulfillmentSelectorProps) {
  const router = useRouter()

  // Current step and selections
  const [step, setStep] = useState<Step>("select")
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null)

  // Form data
  const [address, setAddress] = useState<DeliveryAddress | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string>("")
  const [scheduledTimeWindow, setScheduledTimeWindow] = useState<string>("")
  const [pickupLocationId, setPickupLocationId] = useState<string>("")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cart total in dollars
  const cartTotal = (cart.total || 0) / 100

  // Get minimum thresholds from config
  const minimums = useMemo(() => ({
    atlantaDelivery: config?.MinimumOrderThresholds?.AtlantaDelivery || 0,
    plantPickup: config?.MinimumOrderThresholds?.PlantPickup || 0,
    southeastPickup: config?.MinimumOrderThresholds?.SoutheastPickup || 0,
    upsShipping: config?.MinimumOrderThresholds?.UPSShipping || 40,
  }), [config])

  // Check availability based on minimums
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

  // Get selected location details
  const selectedLocation = useMemo(() => {
    if (!pickupLocationId || !config?.SoutheastPickupLocations) return null
    return config.SoutheastPickupLocations.find((l) => l.id === pickupLocationId)
  }, [pickupLocationId, config])

  // Pre-fill from customer data
  useEffect(() => {
    if (customer?.addresses?.[0]) {
      const addr = customer.addresses[0]
      setAddress({
        firstName: addr.first_name || "",
        lastName: addr.last_name || "",
        address: addr.address_1 || "",
        city: addr.city || "",
        state: addr.province || "GA",
        zip: addr.postal_code || "",
        phone: addr.phone || "",
      })
    }
  }, [customer])

  // Handle option selection
  const handleOptionSelect = (option: FulfillmentType) => {
    setSelectedOption(option)
    setError(null)
    
    // Reset scheduling data when switching options
    setScheduledDate("")
    setScheduledTimeWindow("")
    
    // Navigate to appropriate next step
    switch (option) {
      case "ups_shipping":
        setStep("schedule")
        break
      case "atlanta_delivery":
        setStep("address")
        break
      case "plant_pickup":
        setStep("schedule")
        break
      case "southeast_pickup":
        setStep("location")
        break
    }
  }

  // Handle address submission (for Atlanta delivery)
  const handleAddressSubmit = (addr: DeliveryAddress) => {
    setAddress(addr)
    setStep("schedule")
  }

  // Handle location selection complete (for Southeast pickup)
  const handleLocationComplete = () => {
    if (pickupLocationId) {
      setStep("schedule")
    }
  }

  // Submit fulfillment to cart
  const submitFulfillment = async () => {
    if (!selectedOption) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      // Get ZIP from address or default
      const fulfillmentZip =
        selectedOption === "atlanta_delivery" || selectedOption === "ups_shipping"
          ? address?.zip || ""
          : "00000" // Placeholder for pickup

      await setFulfillmentDetails({
        cartId: cart.id,
        fulfillmentType: selectedOption,
        fulfillmentZip,
        scheduledDate,
        scheduledTimeWindow: scheduledTimeWindow || undefined,
        pickupLocationId: pickupLocationId || undefined,
      })

      // For pickup orders, we need to set a shipping method (Medusa requires it)
      if (selectedOption === "plant_pickup" || selectedOption === "southeast_pickup") {
        console.log("Looking for pickup option for:", selectedOption)
        
        const pickupOption = await findPickupOption(cart.id, selectedOption)
        
        if (pickupOption) {
          console.log("Setting shipping method to:", pickupOption.id, pickupOption.name)
          await setShippingMethod({
            cartId: cart.id,
            shippingMethodId: pickupOption.id,
          })
        } else {
          console.error("No pickup option found for:", selectedOption)
          setError("No pickup option available. Please contact support.")
          setIsSubmitting(false)
          return
        }
      }

      // Refresh the page to show the next checkout steps
      // (the page will re-render and CheckoutForm will now show addresses/payment)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to save fulfillment details")
      setIsSubmitting(false)
    }
  }

  // Go back to options
  const goBack = () => {
    if (step === "schedule" && selectedOption === "southeast_pickup") {
      setStep("location")
    } else if (step === "schedule" && selectedOption === "atlanta_delivery") {
      setStep("address")
    } else {
      setStep("select")
      setSelectedOption(null)
    }
  }

  // Fulfillment options data
  const options = [
    {
      id: "ups_shipping" as FulfillmentType,
      title: "Ship to Me",
      subtitle: "Continental US delivery via UPS",
      icon: <TruckIcon />,
      available: availability.upsShipping,
      minimum: minimums.upsShipping,
      amountAway: availability.upsAmountAway,
    },
    {
      id: "atlanta_delivery" as FulfillmentType,
      title: "Atlanta Metro Delivery",
      subtitle: "Local delivery to your door",
      icon: <DeliveryIcon />,
      available: availability.atlantaDelivery,
      minimum: minimums.atlantaDelivery,
      amountAway: availability.atlantaDeliveryAmountAway,
    },
    {
      id: "plant_pickup" as FulfillmentType,
      title: "Plant Pickup",
      subtitle: config?.PlantPickupAddress 
        ? `${config.PlantPickupCity}, ${config.PlantPickupState}`
        : "Atlanta, GA",
      icon: <PlantIcon />,
      available: availability.plantPickup,
      minimum: minimums.plantPickup,
      amountAway: availability.plantPickupAmountAway,
    },
    {
      id: "southeast_pickup" as FulfillmentType,
      title: "Southeast Pickup",
      subtitle: "Pick up at a location near you",
      icon: <MapPinIcon />,
      available: availability.southeastPickup,
      minimum: minimums.southeastPickup,
      amountAway: availability.southeastAmountAway,
    },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Step 1: Select Fulfillment Option */}
        {step === "select" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              How would you like to receive your order?
            </h1>
            <p className="text-gray-600 mb-6">
              Select your preferred fulfillment method.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => option.available && handleOptionSelect(option.id)}
                  disabled={!option.available}
                  className={`
                    relative p-5 rounded-lg border-2 text-left transition-all
                    ${option.available 
                      ? "border-gray-200 hover:border-Gold hover:shadow-md cursor-pointer" 
                      : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                    }
                    ${selectedOption === option.id ? "border-Gold ring-2 ring-Gold/20" : ""}
                  `}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`mb-3 ${option.available ? "text-gray-700" : "text-gray-400"}`}>
                      {option.icon}
                    </div>
                    <h3 className={`font-semibold ${option.available ? "text-gray-900" : "text-gray-500"}`}>
                      {option.title}
                    </h3>
                    <p className={`text-sm mt-1 ${option.available ? "text-gray-500" : "text-gray-400"}`}>
                      {option.subtitle}
                    </p>
                    
                    {/* Minimum order message */}
                    {!option.available && option.minimum > 0 && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        Add {convertToLocale({ amount: option.amountAway * 100, currency_code: cart.currency_code })} more
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Address Form (for Atlanta Delivery & UPS Shipping) */}
        {step === "address" && selectedOption === "atlanta_delivery" && (
          <AddressForm
            initialAddress={address}
            onSubmit={handleAddressSubmit}
            onBack={goBack}
            atlantaZipCodes={config?.AtlantaDeliveryZipCodes || []}
            isSubmitting={false}
          />
        )}

        {/* Location Selection (for Southeast Pickup) */}
        {step === "location" && selectedOption === "southeast_pickup" && (
          <div>
            <button
              type="button"
              onClick={goBack}
              className="text-Gold hover:text-Gold/80 text-sm mb-4 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Select Pickup Location
            </h2>
            <p className="text-gray-600 mb-4">
              Choose a Southeast pickup point near you.
            </p>

            <SoutheastPickupScheduling
              config={config}
              selectedDate=""
              selectedLocationId={pickupLocationId}
              onDateChange={() => {}}
              onLocationChange={setPickupLocationId}
            />

            {pickupLocationId && (
              <Button
                className="w-full mt-6"
                size="large"
                onClick={handleLocationComplete}
              >
                Continue to Select Date
              </Button>
            )}
          </div>
        )}

        {/* Scheduling */}
        {step === "schedule" && (
          <div>
            <button
              type="button"
              onClick={goBack}
              className="text-Gold hover:text-Gold/80 text-sm mb-4 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* UPS Shipping */}
            {selectedOption === "ups_shipping" && (
              <UPSShippingScheduling
                cart={cart}
                selectedDate={scheduledDate}
                onDateChange={setScheduledDate}
              />
            )}

            {/* Atlanta Delivery */}
            {selectedOption === "atlanta_delivery" && (
              <AtlantaDeliveryScheduling
                config={config}
                selectedDate={scheduledDate}
                selectedTimeWindow={scheduledTimeWindow}
                onDateChange={setScheduledDate}
                onTimeWindowChange={setScheduledTimeWindow}
              />
            )}

            {/* Plant Pickup */}
            {selectedOption === "plant_pickup" && (
              <PlantPickupScheduling
                config={config}
                selectedDate={scheduledDate}
                onDateChange={setScheduledDate}
              />
            )}

            {/* Southeast Pickup - Date Selection */}
            {selectedOption === "southeast_pickup" && selectedLocation && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Select Pickup Date</h2>
                <p className="text-gray-600 mb-4">
                  Pickup at <span className="font-medium">{selectedLocation.Name}</span>
                </p>
                <SoutheastPickupScheduling
                  config={config}
                  selectedDate={scheduledDate}
                  selectedLocationId={pickupLocationId}
                  onDateChange={setScheduledDate}
                  onLocationChange={() => {}}
                />
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              className="w-full mt-6"
              size="large"
              onClick={submitFulfillment}
              isLoading={isSubmitting}
              disabled={
                !scheduledDate || 
                (selectedOption === "atlanta_delivery" && !scheduledTimeWindow)
              }
            >
              Continue to Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

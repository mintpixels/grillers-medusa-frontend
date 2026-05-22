"use client"

import { useState, useMemo, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { setFulfillmentDetails, setShippingMethod, type FulfillmentType } from "@lib/data/cart"
import { saveAddressToProfileAndCart } from "@lib/data/customer"
import { findShippingOptionByType } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import {
  SE_PICKUP_CREDIT_AMOUNT,
  SE_PICKUP_CREDIT_THRESHOLD,
} from "@lib/util/free-shipping-codes"
import type { FulfillmentConfigData, PickupCreditConfig } from "@lib/data/strapi/checkout"
import { useFulfillmentEdit } from "@modules/checkout/context/fulfillment-edit-context"
import PlantPickupScheduling from "@modules/checkout/components/fulfillment-selector/scheduling/plant-pickup"
import SoutheastPickupScheduling from "@modules/checkout/components/fulfillment-selector/scheduling/southeast-pickup"
import AddressForm, { type DeliveryAddress } from "@modules/checkout/components/fulfillment-selector/address-form"

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

const CheckCircleIcon = () => (
  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const fulfillmentLabels: Record<FulfillmentType, { label: string; description: string }> = {
  ups_shipping: {
    label: "UPS Shipping",
    description: "Nationwide delivery via UPS. Packed in insulated containers to ensure freshness.",
  },
  atlanta_delivery: {
    label: "Local Delivery",
    description: "Fresh delivery to your door within the Atlanta metro area.",
  },
  plant_pickup: {
    label: "Plant Pickup",
    description: "Pick up at our Atlanta facility. Please bring a valid ID.",
  },
  southeast_pickup: {
    label: "Regional Pickup",
    description: "Collect from a partner pickup location in the Southeast.",
  },
}

type SubStep = "select" | "plant_date" | "southeast_pickup" | "save_address" | "switch_address"

function getPreferredAddress(customer: HttpTypes.StoreCustomer | null) {
  const addresses = customer?.addresses || []
  if (!addresses.length) return null
  return (
    addresses.find((address) => address.is_default_shipping) ||
    addresses.find((address) => address.is_default_billing) ||
    addresses[0]
  )
}

function formatAddressLine(address: { address_1?: string | null; city?: string | null; province?: string | null; postal_code?: string | null } | null | undefined) {
  if (!address) return ""
  return [address.address_1, address.city, address.province]
    .filter(Boolean)
    .join(", ")
    .concat(address.postal_code ? ` ${address.postal_code}` : "")
}

function hasUsableAddress(
  address:
    | HttpTypes.StoreCartAddress
    | HttpTypes.StoreCustomerAddress
    | null
    | undefined
) {
  return Boolean(address?.address_1 && address?.postal_code)
}

function friendlyFulfillmentError(message?: string) {
  if (!message) {
    return "We could not save that fulfillment method. Please try another option."
  }
  if (/server components render|digest|failed to fetch|unknown error/i.test(message)) {
    return "We could not save that fulfillment method for this address. Please try another option or update your address."
  }
  return message
}

export default function FulfillmentStep({ cart, customer, config, availableFulfillmentTypes, pickupCreditConfig }: FulfillmentStepProps) {
  const router = useRouter()
  const { setIsEditingFulfillment } = useFulfillmentEdit()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subStep, setSubStep] = useState<SubStep>("select")
  const [pendingPickupDate, setPendingPickupDate] = useState("")
  const [pendingSELocationId, setPendingSELocationId] = useState("")
  const [pendingSEDate, setPendingSEDate] = useState("")
  const [savingAddress, setSavingAddress] = useState(false)
  const [saveAddressError, setSaveAddressError] = useState<string | null>(null)
  // useTransition lets us treat router.refresh() as an awaitable pending
  // state — `isRefreshing` stays true until the new server-rendered tree
  // is committed, so we can hold a loading overlay across the entire
  // save-address → refresh → re-render cycle and the user never sees the
  // intermediate "old cart" flash.
  const [isRefreshing, startTransition] = useTransition()
  const isBusy = savingAddress || isSubmitting || isRefreshing

  const attachShippingMethod = async (type: FulfillmentType) => {
    if (type === "ups_shipping") return
    // Wrap so a Medusa rejection (e.g., no matching shipping option) surfaces inline
    // instead of bubbling out and crashing the Server Components render boundary.
    try {
      const option = await findShippingOptionByType(cart.id, type)
      if (option) {
        await setShippingMethod({ cartId: cart.id, shippingMethodId: option.id })
      } else {
        throw new Error(`No shipping option available for ${type.replace(/_/g, " ")}. Please choose a different fulfillment method.`)
      }
    } catch (err: any) {
      throw new Error(err?.message || "Could not attach shipping method")
    }
  }

  const rawFulfillmentType = cart.metadata?.fulfillmentType as string | undefined
  const fulfillmentType = rawFulfillmentType && rawFulfillmentType.length > 0 ? rawFulfillmentType as FulfillmentType : undefined
  const scheduledDate = cart.metadata?.scheduledDate as string | undefined
  const hasFulfillment = Boolean(fulfillmentType)

  const showSelection = !hasFulfillment || isEditing

  useEffect(() => {
    setIsEditingFulfillment(showSelection)
  }, [showSelection, setIsEditingFulfillment])

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

  // Pull active shipping address from cart when it is actually usable, then
  // fall back to the customer's saved address. Medusa can return an empty or
  // ZIP-only cart address during staff/customer handoff; that should not mask
  // a complete address that exists in the profile.
  const preferredCustomerAddress = getPreferredAddress(customer)
  const activeAddress = hasUsableAddress(cart.shipping_address)
    ? cart.shipping_address
    : hasUsableAddress(preferredCustomerAddress)
      ? preferredCustomerAddress
      : cart.shipping_address || preferredCustomerAddress
  const shipZip = (activeAddress?.postal_code || "").trim()
  const shipCity = (activeAddress?.city || "").trim()
  const savedAddresses = customer?.addresses || []
  const canSwitchAddress = savedAddresses.length > 1
  const activeAddressId =
    (activeAddress as HttpTypes.StoreCustomerAddress | null | undefined)?.id || null

  const isAtlantaZip = (zip: string) =>
    Boolean(zip) && (config?.AtlantaDeliveryZipCodes || []).includes(zip)

  const isSoutheastPickupCity = (zip: string, city: string) => {
    if (!config?.SoutheastPickupLocations) return false
    return config.SoutheastPickupLocations.some(
      (loc) =>
        (loc.ZipCode && loc.ZipCode === zip) ||
        (loc.City && city && loc.City.toLowerCase() === city.toLowerCase())
    )
  }

  const availability = useMemo(() => {
    const inAtlanta = isAtlantaZip(shipZip)
    const nearSoutheastPickup = isSoutheastPickupCity(shipZip, shipCity)
    const haveAddress = Boolean(shipZip)

    return {
      // UPS targets out-of-region delivery. If we know the address is in Atlanta, hide it.
      upsShipping: cartTotal >= minimums.upsShipping && (!haveAddress || !inAtlanta),
      upsAmountAway: Math.max(0, minimums.upsShipping - cartTotal),
      upsReason: haveAddress && inAtlanta
        ? "Available for addresses outside our local delivery region"
        : null,

      atlantaDelivery: cartTotal >= minimums.atlantaDelivery && haveAddress && inAtlanta,
      atlantaDeliveryAmountAway: Math.max(0, minimums.atlantaDelivery - cartTotal),
      atlantaDeliveryReason: !haveAddress
        ? "Add an Atlanta-area address to enable"
        : !inAtlanta
          ? "Available for Atlanta-area addresses only"
          : null,

      // Plant pickup is always eligible — anyone can drive to the plant.
      plantPickup: cartTotal >= minimums.plantPickup,
      plantPickupAmountAway: Math.max(0, minimums.plantPickup - cartTotal),
      plantPickupReason: null as string | null,

      southeastPickup: cartTotal >= minimums.southeastPickup && haveAddress && nearSoutheastPickup,
      southeastAmountAway: Math.max(0, minimums.southeastPickup - cartTotal),
      southeastReason: !haveAddress
        ? "Add a shipping address to check pickup availability"
        : !nearSoutheastPickup
          ? "Available near Southeast partner cities only"
          : null,
    }
  }, [cartTotal, minimums, shipZip, shipCity, config])

  const pickupCreditQualifies = cartSubtotal >= pickupCreditConfig.threshold
  const pickupCreditAmountAway = Math.max(0, pickupCreditConfig.threshold - cartSubtotal)

  const southeastCreditQualifies = cartSubtotal >= SE_PICKUP_CREDIT_THRESHOLD
  const southeastCreditAmountAway = Math.max(
    0,
    SE_PICKUP_CREDIT_THRESHOLD - cartSubtotal
  )

  const allOptions = [
    {
      id: "ups_shipping" as FulfillmentType,
      title: "Ship to Me",
      subtitle: "Continental US via UPS",
      icon: <TruckIcon />,
      available: availability.upsShipping,
      amountAway: availability.upsAmountAway,
      minimum: minimums.upsShipping,
      reason: availability.upsReason,
    },
    {
      id: "atlanta_delivery" as FulfillmentType,
      title: "Atlanta Delivery",
      subtitle: "Local to your door",
      icon: <DeliveryIcon />,
      available: availability.atlantaDelivery,
      amountAway: availability.atlantaDeliveryAmountAway,
      minimum: minimums.atlantaDelivery,
      reason: availability.atlantaDeliveryReason,
    },
    {
      id: "plant_pickup" as FulfillmentType,
      title: "Plant Pickup",
      subtitle: config?.PlantPickupCity ? `${config.PlantPickupCity}, ${config.PlantPickupState}` : "Atlanta, GA",
      icon: <PlantIcon />,
      available: availability.plantPickup,
      amountAway: availability.plantPickupAmountAway,
      minimum: minimums.plantPickup,
      reason: availability.plantPickupReason,
    },
    {
      id: "southeast_pickup" as FulfillmentType,
      title: "Southeast Pickup",
      subtitle: "Free over $250 + $15 credit",
      icon: <MapPinIcon />,
      available: availability.southeastPickup,
      amountAway: availability.southeastAmountAway,
      minimum: minimums.southeastPickup,
      reason: availability.southeastReason,
    },
  ]

  // Always render all 4 fulfillment cards. The static `availability` logic
  // already knows whether each one fits the cart's address + subtotal; we
  // trust it over the Medusa-region `availableFulfillmentTypes` allow-list
  // (which can be misconfigured and accidentally hide UPS Ground for US
  // addresses that absolutely DO ship). If a type is configured at the
  // region level we don't need to do anything; if it isn't, `attachShippingMethod`
  // surfaces a friendly error.
  const options = allOptions

  const hasSavedAddress = Boolean(activeAddress?.postal_code)
  // Show the address CTA when:
  //   1. logged-in customer with no address on file at all, OR
  //   2. they have an address but it doesn't qualify for any local option
  //      (Atlanta delivery, Southeast pickup) — they may want to switch to a
  //      different address (e.g. office vs home) before falling back to UPS.
  const addressUnlocksNothing =
    hasSavedAddress &&
    !availability.atlantaDelivery &&
    !availability.southeastPickup &&
    !availability.atlantaDeliveryReason?.startsWith("Add") &&
    !availability.southeastReason?.startsWith("Add")
  const showAddressCTA = Boolean(customer) && (!hasSavedAddress || addressUnlocksNothing)

  const initialFormAddress: DeliveryAddress | null = activeAddress
    ? {
        firstName: activeAddress.first_name || customer?.first_name || "",
        lastName: activeAddress.last_name || customer?.last_name || "",
        address: activeAddress.address_1 || "",
        city: activeAddress.city || "",
        state: activeAddress.province || "GA",
        zip: activeAddress.postal_code || "",
        phone: activeAddress.phone || "",
      }
    : customer
      ? {
          firstName: customer.first_name || "",
          lastName: customer.last_name || "",
          address: "",
          city: "",
          state: "GA",
          zip: "",
          phone: customer.phone || "",
        }
      : null

  const handleSaveAddress = async (addr: DeliveryAddress) => {
    setSavingAddress(true)
    setSaveAddressError(null)
    const res = await saveAddressToProfileAndCart({
      first_name: addr.firstName,
      last_name: addr.lastName,
      address_1: addr.address,
      city: addr.city,
      province: addr.state,
      postal_code: addr.zip,
      phone: addr.phone,
    })
    if (!res.success) {
      setSavingAddress(false)
      setSaveAddressError(res.error || "Could not save your address.")
      return
    }
    // Keep the loading overlay up across the server refresh so the cards
    // never flash with the old address state.
    startTransition(() => {
      setSubStep("select")
      router.refresh()
      setSavingAddress(false)
    })
  }

  const handlePickSavedAddress = async (address: HttpTypes.StoreCustomerAddress) => {
    if (isBusy) return
    setSavingAddress(true)
    setSaveAddressError(null)
    const res = await saveAddressToProfileAndCart({
      first_name: address.first_name || customer?.first_name || "",
      last_name: address.last_name || customer?.last_name || "",
      address_1: address.address_1 || "",
      city: address.city || "",
      province: address.province || "",
      postal_code: address.postal_code || "",
      phone: address.phone || customer?.phone || "",
      country_code: address.country_code || undefined,
    })
    if (!res.success) {
      setSavingAddress(false)
      setSaveAddressError(res.error || "Could not switch to that address.")
      return
    }
    startTransition(() => {
      setSubStep("select")
      router.refresh()
      setSavingAddress(false)
    })
  }

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
        fulfillmentZip: option === "atlanta_delivery" ? shipZip : "00000",
        scheduledDate: today,
      })

      await attachShippingMethod(option)

      setIsEditing(false)
      setSubStep("select")
      router.refresh()
    } catch (err: any) {
      setError(friendlyFulfillmentError(err.message))
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
      setError(friendlyFulfillmentError(err.message))
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
      setError(friendlyFulfillmentError(err.message))
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
    <div
      className={`relative rounded-2xl p-5 shadow-sm border transition-colors ${
        showSelection
          ? "bg-white border-gray-200"
          : "bg-gradient-to-br from-Gold/[0.12] via-Gold/[0.06] to-transparent border-Gold/20"
      }`}
      aria-busy={isBusy || undefined}
    >
      {/* Loading overlay — held across the server refresh so the cards never
          flash with stale state while the address/fulfillment swap propagates. */}
      {isBusy && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-full bg-white shadow-md border border-gray-200 px-4 py-2">
            <svg className="animate-spin h-4 w-4 text-Gold" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-semibold text-Charcoal">Updating…</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-Gold text-white text-sm font-semibold shadow-sm">
            1
          </span>
          <h2 className="text-lg font-semibold text-gray-900">Fulfillment Method</h2>
          {hasFulfillment && !isEditing && <CheckCircleIcon />}
        </div>
        {hasFulfillment && (
          <button
            type="button"
            onClick={handleChange}
            disabled={isSubmitting}
            className="flex items-center gap-1 text-sm text-Gold hover:text-Gold/80 font-semibold transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : isEditing ? "Cancel" : "Change"}
            {!isEditing && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Selection Mode */}
      <div className={`transition-all duration-300 ease-out ${showSelection && subStep === "select" ? "opacity-100" : showSelection ? "hidden" : "hidden"}`}>
        <h2 className="text-lg font-semibold text-Charcoal mb-0.5">
          How would you like to receive your order?
        </h2>
        <p className="text-sm text-Charcoal/60 mb-4">
          Select your preferred fulfillment method.
        </p>

        {/* CTA: address gate. Two flavors:
            (a) no address on file → invite the customer to add one
            (b) address on file but doesn't unlock Atlanta or Southeast →
                show their current address with an "Edit" CTA so they can
                try a different one (e.g. work vs home) before falling back
                to UPS. Both save to BOTH the customer profile and the cart. */}
        {/* Qualifying-address summary: tells customer which saved address we're
            using to compute fulfillment availability and gives them a way to
            switch without going all the way into Step 2. */}
        {!showAddressCTA && hasSavedAddress && Boolean(customer) && (
          <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-white/70 border border-Gold/20">
            <div className="flex items-start gap-2 min-w-0">
              <svg className="w-4 h-4 text-Gold flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs text-Charcoal/70 leading-snug min-w-0 truncate">
                <span className="font-semibold text-Charcoal">Shipping to:</span>{" "}
                {formatAddressLine(activeAddress)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSaveAddressError(null)
                setSubStep(canSwitchAddress ? "switch_address" : "save_address")
              }}
              className="flex-shrink-0 text-xs font-semibold text-Gold hover:text-Gold/80 transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {showAddressCTA && (
          <div className="mb-4 p-4 rounded-xl border border-Gold/30 bg-Gold/[0.07]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-Gold flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                {hasSavedAddress ? (
                  <>
                    <p className="text-sm font-semibold text-Charcoal leading-tight">
                      Local delivery and pickup aren't available for this address
                    </p>
                    <p className="text-xs text-Charcoal/65 mt-1 leading-snug">
                      Currently using <span className="font-medium">{[activeAddress?.address_1, activeAddress?.city, activeAddress?.province].filter(Boolean).join(", ")} {activeAddress?.postal_code}</span>. Try a different address to see more options.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-Charcoal leading-tight">
                      We don't have your delivery address yet
                    </p>
                    <p className="text-xs text-Charcoal/65 mt-1 leading-snug">
                      Add one to unlock Atlanta delivery and Southeast pickup. We'll save it to your profile.
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSaveAddressError(null)
                  setSubStep(canSwitchAddress ? "switch_address" : "save_address")
                }}
                className="flex-shrink-0 h-9 px-3 text-xs font-semibold text-white bg-Gold rounded-lg hover:bg-Gold/90 transition-colors"
              >
                {hasSavedAddress ? (canSwitchAddress ? "Change Address" : "Edit Address") : "Add Address"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => {
            // A disabled card is "addressable" only when the customer has NO
            // saved address at all. Once an address is on file, a card that
            // doesn't qualify (e.g. Atlanta Delivery for a Cincinnati ZIP)
            // shouldn't pretend it can be unlocked by "adding an address" —
            // the Change Address banner above already covers that case.
            const blockedByMissingAddress =
              !option.available &&
              !hasSavedAddress &&
              showAddressCTA &&
              cartTotal >= option.minimum &&
              (option.id === "atlanta_delivery" || option.id === "southeast_pickup")
            const clickable = (option.available || blockedByMissingAddress) && !isSubmitting
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (option.available) handleSelectOption(option.id)
                  else if (blockedByMissingAddress) {
                    setSaveAddressError(null)
                    setSubStep("save_address")
                  }
                }}
                disabled={!clickable}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all duration-200 bg-white
                  ${option.available && !isSubmitting
                    ? "border-gray-200 hover:border-Gold hover:shadow-md cursor-pointer active:scale-[0.98]"
                    : blockedByMissingAddress
                      ? "border-gray-200 hover:border-Gold hover:shadow-md cursor-pointer opacity-90"
                      : "border-gray-100 bg-gray-50/80 cursor-not-allowed opacity-50"
                  }
                `}
              >
                <div className="flex flex-col">
                  <div className={`mb-2.5 ${clickable ? "text-Charcoal/80" : "text-gray-400"}`}>
                    {option.icon}
                  </div>
                  <h3 className={`font-semibold text-sm leading-tight ${clickable ? "text-Charcoal" : "text-gray-500"}`}>
                    {option.title}
                  </h3>
                  <p className={`text-xs mt-0.5 leading-snug ${clickable ? "text-Charcoal/50" : "text-gray-400"}`}>
                    {option.subtitle}
                  </p>

                  {option.id === "plant_pickup" && option.available && (
                    <p className="text-xs text-green-600 mt-2.5 font-semibold leading-tight">
                      {pickupCreditQualifies
                        ? `${convertToLocale({ amount: pickupCreditConfig.creditAmount, currency_code: cart.currency_code })} pickup credit!`
                        : `Add ${convertToLocale({ amount: pickupCreditAmountAway, currency_code: cart.currency_code })} for a ${convertToLocale({ amount: pickupCreditConfig.creditAmount, currency_code: cart.currency_code })} credit`
                      }
                    </p>
                  )}

                  {option.id === "southeast_pickup" && option.available && (
                    <p className="text-xs text-green-600 mt-2.5 font-semibold leading-tight">
                      {southeastCreditQualifies
                        ? `Save ${convertToLocale({ amount: SE_PICKUP_CREDIT_AMOUNT, currency_code: cart.currency_code })} with Southeast Pickup`
                        : `Add ${convertToLocale({ amount: southeastCreditAmountAway, currency_code: cart.currency_code })} to save ${convertToLocale({ amount: SE_PICKUP_CREDIT_AMOUNT, currency_code: cart.currency_code })}`
                      }
                    </p>
                  )}

                  {!option.available && option.minimum > 0 && cartTotal < option.minimum && (
                    <p className="text-xs text-amber-600 mt-2.5 font-semibold">
                      Add {convertToLocale({ amount: option.amountAway, currency_code: cart.currency_code })} more
                    </p>
                  )}
                  {!option.available && option.reason && cartTotal >= option.minimum && (
                    <p className={`text-xs mt-2.5 font-medium leading-tight ${blockedByMissingAddress ? "text-Gold" : "text-Charcoal/60"}`}>
                      {blockedByMissingAddress ? "Add address to enable" : option.reason}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Save Address sub-step */}
      {showSelection && subStep === "save_address" && (
        <div>
          <AddressForm
            initialAddress={initialFormAddress}
            onSubmit={handleSaveAddress}
            onBack={() => { setSaveAddressError(null); setSubStep("select") }}
            atlantaZipCodes={[]}
            isSubmitting={savingAddress}
            mode="general"
          />
          {saveAddressError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm">
              {saveAddressError}
            </div>
          )}
        </div>
      )}

      {/* Switch Address sub-step — pick from saved customer addresses */}
      {showSelection && subStep === "switch_address" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-Charcoal">Choose a shipping address</h3>
            <button
              type="button"
              onClick={() => { setSaveAddressError(null); setSubStep("select") }}
              className="text-xs font-semibold text-Charcoal/60 hover:text-Charcoal"
              disabled={savingAddress}
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {savedAddresses.map((address) => {
              const isActive = activeAddressId === address.id
              return (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => handlePickSavedAddress(address)}
                  disabled={savingAddress}
                  className={`text-left p-3 rounded-xl border-2 transition-all bg-white ${
                    isActive
                      ? "border-Gold shadow-sm"
                      : "border-gray-200 hover:border-Gold/60"
                  } ${savingAddress ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-Charcoal truncate">
                        {[address.first_name, address.last_name].filter(Boolean).join(" ") || "Saved address"}
                      </p>
                      <p className="text-xs text-Charcoal/65 mt-0.5 leading-snug">
                        {formatAddressLine(address)}
                      </p>
                    </div>
                    {isActive && (
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-Gold bg-Gold/10 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => { setSaveAddressError(null); setSubStep("save_address") }}
            disabled={savingAddress}
            className="mt-3 w-full text-center text-sm font-semibold text-Gold hover:text-Gold/80 transition-colors py-2 border border-dashed border-Gold/30 rounded-xl"
          >
            + Add a new address
          </button>
          {saveAddressError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-sm">
              {saveAddressError}
            </div>
          )}
        </div>
      )}

      {/* Plant Pickup Date Selection */}
      {showSelection && subStep === "plant_date" && (
        <PlantPickupScheduling
          config={config}
          selectedDate={pendingPickupDate}
          onDateChange={setPendingPickupDate}
          onConfirm={handleConfirmPickupDate}
          onBack={() => setSubStep("select")}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Southeast Pickup Location/Date Selection */}
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
          isSubmitting={isSubmitting}
        />
      )}

      {/* Summary Mode */}
      {!showSelection && fulfillmentType && (
        <div className="flex items-start gap-4">
          <div className="p-3 bg-Gold rounded-xl text-white shadow-md shrink-0">
            {options.find(o => o.id === fulfillmentType)?.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-Charcoal mb-1 tracking-tight">
              {fulfillmentLabels[fulfillmentType].label}
            </h3>
            
            {scheduledDate && (
              <div className="flex items-center gap-1.5 text-sm text-Charcoal/70 mb-1.5">
                <CalendarIcon />
                <span className="font-medium">{scheduledDate}</span>
              </div>
            )}
            
            <p className="text-sm text-Charcoal/55 leading-relaxed">
              {fulfillmentLabels[fulfillmentType].description}
            </p>

            {fulfillmentType === "southeast_pickup" && Boolean(cart.metadata?.pickupLocationId) && (() => {
              const pickupLocationId = String(cart.metadata?.pickupLocationId)
              const locationName =
                config.SoutheastPickupLocations?.find((l) => l.id === pickupLocationId)?.Name ||
                pickupLocationId
              return (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-Charcoal/70">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{locationName}</span>
                </div>
              )
            })()}

            {fulfillmentType === "plant_pickup" && pickupCreditQualifies && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {convertToLocale({ amount: pickupCreditConfig.creditAmount, currency_code: cart.currency_code })} pickup credit applied
              </div>
            )}

            {fulfillmentType === "southeast_pickup" && southeastCreditQualifies && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {convertToLocale({ amount: SE_PICKUP_CREDIT_AMOUNT, currency_code: cart.currency_code })} pickup credit applied
              </div>
            )}

            {fulfillmentType === "plant_pickup" && config.PlantPickupPostOrderNote && (
              <div className="mt-3 bg-Gold/5 border border-Gold/15 rounded-xl p-3">
                <p className="text-xs text-Charcoal/55 leading-relaxed">
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

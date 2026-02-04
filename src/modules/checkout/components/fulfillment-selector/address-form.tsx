"use client"

import { useState, useEffect } from "react"
import { Button, clx } from "@medusajs/ui"

export type DeliveryAddress = {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
}

type AddressFormProps = {
  initialAddress?: DeliveryAddress | null
  onSubmit: (address: DeliveryAddress) => void
  onBack: () => void
  atlantaZipCodes: string[]
  isSubmitting?: boolean
}

const US_STATES = [
  { value: "GA", label: "Georgia" },
  { value: "AL", label: "Alabama" },
  { value: "FL", label: "Florida" },
  { value: "SC", label: "South Carolina" },
  { value: "NC", label: "North Carolina" },
  { value: "TN", label: "Tennessee" },
]

export default function AddressForm({
  initialAddress,
  onSubmit,
  onBack,
  atlantaZipCodes,
  isSubmitting = false,
}: AddressFormProps) {
  const [address, setAddress] = useState<DeliveryAddress>({
    firstName: initialAddress?.firstName || "",
    lastName: initialAddress?.lastName || "",
    address: initialAddress?.address || "",
    city: initialAddress?.city || "",
    state: initialAddress?.state || "GA",
    zip: initialAddress?.zip || "",
    phone: initialAddress?.phone || "",
  })

  const [zipError, setZipError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validate ZIP against Atlanta delivery zone
  useEffect(() => {
    if (address.zip.length === 5) {
      const isValidZip = atlantaZipCodes.length === 0 || atlantaZipCodes.includes(address.zip)
      if (!isValidZip) {
        setZipError("Delivery is not available in your area. Please try pickup instead.")
      } else {
        setZipError(null)
      }
    } else {
      setZipError(null)
    }
  }, [address.zip, atlantaZipCodes])

  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    // Clean up phone and zip inputs
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10)
    }
    if (field === "zip") {
      value = value.replace(/\D/g, "").slice(0, 5)
    }

    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const isValid =
    address.firstName.trim() &&
    address.lastName.trim() &&
    address.address.trim() &&
    address.city.trim() &&
    address.state &&
    address.zip.length === 5 &&
    address.phone.length === 10 &&
    !zipError

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onSubmit(address)
    }
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 0) return ""
    if (phone.length <= 3) return `(${phone}`
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-Gold hover:text-Gold/80 text-sm mb-4 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold mb-2">Where should we deliver?</h2>
      <p className="text-gray-600 mb-6">
        Enter your delivery address. Delivery is available in the Atlanta metro area.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={address.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={clx(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent",
                {
                  "border-red-300": touched.firstName && !address.firstName.trim(),
                  "border-gray-300": !touched.firstName || address.firstName.trim(),
                }
              )}
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={address.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={clx(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent",
                {
                  "border-red-300": touched.lastName && !address.lastName.trim(),
                  "border-gray-300": !touched.lastName || address.lastName.trim(),
                }
              )}
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            id="address"
            value={address.address}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            className={clx(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent",
              {
                "border-red-300": touched.address && !address.address.trim(),
                "border-gray-300": !touched.address || address.address.trim(),
              }
            )}
            placeholder="123 Main St"
          />
        </div>

        {/* City, State, ZIP Row */}
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-3">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              value={address.city}
              onChange={(e) => handleChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
              className={clx(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent",
                {
                  "border-red-300": touched.city && !address.city.trim(),
                  "border-gray-300": !touched.city || address.city.trim(),
                }
              )}
              placeholder="Atlanta"
            />
          </div>
          <div className="col-span-1">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              id="state"
              value={address.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent bg-white"
            >
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.value}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              id="zip"
              inputMode="numeric"
              value={address.zip}
              onChange={(e) => handleChange("zip", e.target.value)}
              onBlur={() => handleBlur("zip")}
              className={clx(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent",
                {
                  "border-red-300": zipError || (touched.zip && address.zip.length !== 5),
                  "border-gray-300": !zipError && (!touched.zip || address.zip.length === 5),
                }
              )}
              placeholder="30301"
              maxLength={5}
            />
          </div>
        </div>

        {/* ZIP Error */}
        {zipError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {zipError}
            </p>
          </div>
        )}

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            inputMode="numeric"
            value={formatPhone(address.phone)}
            onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
            onBlur={() => handleBlur("phone")}
            className={clx(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent",
              {
                "border-red-300": touched.phone && address.phone.length !== 10,
                "border-gray-300": !touched.phone || address.phone.length === 10,
              }
            )}
            placeholder="(404) 555-1234"
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll text you delivery updates
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-Gold/10 border border-Gold/30 rounded-lg">
          <p className="text-sm text-Charcoal flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Delivery is available in the Atlanta metro area only
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="large"
          disabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
        >
          Continue to Schedule
        </Button>
      </form>
    </div>
  )
}

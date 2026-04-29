"use client"

import React, { useState } from "react"
import Input from "@modules/common/components/input"
import USStateSelect, {
  normalizeStateCode,
} from "@modules/common/components/us-state-select"
import AddressAutocomplete from "@modules/checkout/components/address-autocomplete"
import { HttpTypes } from "@medusajs/types"

type AddressFormFieldsProps = {
  defaults?: Partial<HttpTypes.StoreCustomerAddress> | null
  showDefaultFlags?: boolean
  isOnlyAddress?: boolean
}

// Shared form fields used by Add Address + Edit Address modals.
// - Replaces the old free-text "Province / State" input with a US state
//   dropdown (#51).
// - Locks country to US via a hidden input — GP only ships to the
//   continental US, so the visible dropdown was confusing optionality (#51).
// - Wires Google Places autocomplete on the Address line 1 field, reusing
//   the same component the checkout uses (#50). Selecting a suggestion
//   auto-fills line 1, city, state, postal code.
// - Renders default-shipping / default-billing checkboxes (#49). The
//   server actions read these from FormData.
const AddressFormFields: React.FC<AddressFormFieldsProps> = ({
  defaults,
  showDefaultFlags = true,
  isOnlyAddress = false,
}) => {
  const [address1, setAddress1] = useState(defaults?.address_1 || "")
  const [city, setCity] = useState(defaults?.city || "")
  const [postalCode, setPostalCode] = useState(defaults?.postal_code || "")
  const [stateCode, setStateCode] = useState(
    normalizeStateCode(defaults?.province) || ""
  )

  const handleAddressSelect = (fields: {
    address_1: string
    city: string
    province: string
    postal_code: string
    country_code: string
  }) => {
    setAddress1(fields.address_1)
    setCity(fields.city)
    setPostalCode(fields.postal_code)
    setStateCode(normalizeStateCode(fields.province))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="grid grid-cols-2 gap-x-2">
        <Input
          label="First name"
          name="first_name"
          required
          autoComplete="given-name"
          defaultValue={defaults?.first_name || undefined}
          data-testid="first-name-input"
        />
        <Input
          label="Last name"
          name="last_name"
          required
          autoComplete="family-name"
          defaultValue={defaults?.last_name || undefined}
          data-testid="last-name-input"
        />
      </div>
      <Input
        label="Company"
        name="company"
        autoComplete="organization"
        defaultValue={defaults?.company || undefined}
        data-testid="company-input"
      />
      <AddressAutocomplete
        name="address_1"
        label="Address"
        required
        autoComplete="address-line1"
        value={address1}
        onChange={(e) => setAddress1(e.target.value)}
        onAddressSelect={handleAddressSelect}
        data-testid="address-1-input"
      />
      <Input
        label="Apartment, suite, etc."
        name="address_2"
        autoComplete="address-line2"
        defaultValue={defaults?.address_2 || undefined}
        data-testid="address-2-input"
      />
      <div className="grid grid-cols-[144px_1fr] gap-x-2">
        <Input
          label="Postal code"
          name="postal_code"
          required
          autoComplete="postal-code"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          data-testid="postal-code-input"
        />
        <Input
          label="City"
          name="city"
          required
          autoComplete="locality"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          data-testid="city-input"
        />
      </div>
      <USStateSelect
        name="province"
        required
        autoComplete="address-level1"
        value={stateCode}
        onChange={(e) => setStateCode(e.target.value)}
        data-testid="state-select"
      />
      {/* Country is locked to US — GP only ships to the continental US. */}
      <input type="hidden" name="country_code" value="us" />
      <Input
        label="Phone"
        name="phone"
        autoComplete="phone"
        defaultValue={defaults?.phone || undefined}
        data-testid="phone-input"
      />

      {showDefaultFlags && (
        <fieldset className="mt-2 border border-Charcoal/10 rounded-md p-3">
          <legend className="px-1 text-xs font-maison-neue-mono uppercase tracking-wider text-Charcoal/60">
            Save as default
          </legend>
          <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              name="is_default_shipping"
              value="on"
              defaultChecked={
                isOnlyAddress || defaults?.is_default_shipping || false
              }
              className="h-4 w-4"
              data-testid="default-shipping-checkbox"
            />
            <span>Set as default shipping address</span>
          </label>
          <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              name="is_default_billing"
              value="on"
              defaultChecked={
                isOnlyAddress || defaults?.is_default_billing || false
              }
              className="h-4 w-4"
              data-testid="default-billing-checkbox"
            />
            <span>Set as default billing address</span>
          </label>
        </fieldset>
      )}
    </div>
  )
}

export default AddressFormFields

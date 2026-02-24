import { HttpTypes } from "@medusajs/types"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { formatPhone, stripPhone } from "@lib/util/format-phone"
import { useFormPersistence } from "@lib/hooks/use-form-persistence"
import AddressAutocomplete from "../address-autocomplete"
import StateSelect from "../state-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  isPickupOrder = false,
  onPostalCodeChange,
  onEmailBlur,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  isPickupOrder?: boolean
  onPostalCodeChange?: (postalCode: string) => void
  onEmailBlur?: (email: string) => void
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || customer?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || customer?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || customer?.phone || "",
    email: cart?.email || customer?.email || "",
  })

  useFormPersistence(
    "checkout_shipping_draft",
    formData,
    setFormData
  )

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))

      if (onPostalCodeChange) {
        onPostalCodeChange(address?.postal_code || "")
      }
    }

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    if (cart && cart.shipping_address) {
      const addr = cart.shipping_address
      setFormData((prev: Record<string, any>) => {
        const merged = { ...prev }
        if (addr.first_name) merged["shipping_address.first_name"] = addr.first_name
        if (addr.last_name) merged["shipping_address.last_name"] = addr.last_name
        if (addr.address_1) merged["shipping_address.address_1"] = addr.address_1
        if (addr.company) merged["shipping_address.company"] = addr.company
        if (addr.postal_code) merged["shipping_address.postal_code"] = addr.postal_code
        if (addr.city) merged["shipping_address.city"] = addr.city
        if (addr.country_code) merged["shipping_address.country_code"] = addr.country_code
        if (addr.province) merged["shipping_address.province"] = addr.province
        if (addr.phone) merged["shipping_address.phone"] = addr.phone
        if (cart.email) merged.email = cart.email
        return merged
      })

      if (onPostalCodeChange && cart.shipping_address.postal_code) {
        onPostalCodeChange(cart.shipping_address.postal_code)
      }
    }

    if (cart && !cart.email && customer?.email) {
      setFormData((prev: Record<string, any>) => ({ ...prev, email: customer!.email }))
    }
  }, [cart])

  // Always apply customer profile data for empty fields (runs after session restore)
  useEffect(() => {
    if (!customer) return
    setFormData((prev: Record<string, any>) => {
      const next = { ...prev }
      if (!next["shipping_address.first_name"] && customer.first_name) next["shipping_address.first_name"] = customer.first_name
      if (!next["shipping_address.last_name"] && customer.last_name) next["shipping_address.last_name"] = customer.last_name
      if (!next["shipping_address.phone"] && customer.phone) next["shipping_address.phone"] = customer.phone
      // Always keep email in sync with account
      if (customer.email) next.email = customer.email
      return next
    })
  }, [customer])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    if (name === "shipping_address.phone") {
      const digits = stripPhone(value)
      setFormData({ ...formData, [name]: digits })
      return
    }

    setFormData({
      ...formData,
      [name]: value,
    })

    if (name === "shipping_address.postal_code" && onPostalCodeChange) {
      onPostalCodeChange(value)
    }
  }

  const handleAddressSelect = (fields: {
    address_1: string
    city: string
    province: string
    postal_code: string
    country_code: string
  }) => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      "shipping_address.address_1": fields.address_1,
      "shipping_address.city": fields.city,
      "shipping_address.province": fields.province,
      "shipping_address.postal_code": fields.postal_code,
      ...(fields.country_code ? { "shipping_address.country_code": fields.country_code } : {}),
    }))

    if (onPostalCodeChange && fields.postal_code) {
      onPostalCodeChange(fields.postal_code)
    }
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <div className="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <p className="text-sm text-gray-600 mb-3">
            Hi {customer.first_name}, use a saved address?
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <div className="col-span-2">
          <AddressAutocomplete
            label="Address"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            onAddressSelect={handleAddressSelect}
            required
            data-testid="shipping-address-input"
          />
        </div>
        <div className="col-span-2">
          <Input
            label="Company (optional)"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            data-testid="shipping-company-input"
          />
        </div>
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <StateSelect
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-input"
        />
        <Input
          label="Postal code"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
      </div>
      
      {/* Email is pulled from the customer account — no need to show it */}
      <input type="hidden" name="email" value={formData.email} />

      <div className="mt-4">
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formatPhone(formData["shipping_address.phone"])}
          onChange={handleChange}
          placeholder="(555) 555-5555"
          data-testid="shipping-phone-input"
        />
      </div>

      {!isPickupOrder && (
        <div className="mt-5">
          <Checkbox
            label="Billing address same as shipping address"
            name="same_as_billing"
            checked={checked}
            onChange={onChange}
            data-testid="billing-address-checkbox"
          />
        </div>
      )}
    </>
  )
}

export default ShippingAddress

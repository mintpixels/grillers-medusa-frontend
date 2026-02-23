"use client"

import React, { useEffect, useRef, useCallback } from "react"
import { Loader } from "@googlemaps/js-api-loader"

type AddressFields = {
  address_1: string
  city: string
  province: string
  postal_code: string
  country_code: string
}

type AddressAutocompleteProps = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAddressSelect: (fields: AddressFields) => void
  name: string
  label: string
  required?: boolean
  autoComplete?: string
  "data-testid"?: string
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ""

let loaderPromise: Promise<typeof google.maps> | null = null

function getLoader() {
  if (!loaderPromise && GOOGLE_API_KEY) {
    const loader = new Loader({
      apiKey: GOOGLE_API_KEY,
      version: "weekly",
      libraries: ["places"],
    })
    loaderPromise = loader.load().then(() => google.maps)
  }
  return loaderPromise
}

function parsePlace(place: google.maps.places.PlaceResult): AddressFields {
  const components = place.address_components || []
  let streetNumber = ""
  let route = ""
  let city = ""
  let state = ""
  let postalCode = ""
  let country = ""

  for (const component of components) {
    const types = component.types
    if (types.includes("street_number")) {
      streetNumber = component.long_name
    } else if (types.includes("route")) {
      route = component.long_name
    } else if (types.includes("locality")) {
      city = component.long_name
    } else if (types.includes("sublocality_level_1") && !city) {
      city = component.long_name
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name
    } else if (types.includes("postal_code")) {
      postalCode = component.long_name
    } else if (types.includes("country")) {
      country = component.short_name.toLowerCase()
    }
  }

  return {
    address_1: streetNumber ? `${streetNumber} ${route}` : route,
    city,
    province: state,
    postal_code: postalCode,
    country_code: country,
  }
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  name,
  label,
  required,
  autoComplete,
  "data-testid": dataTestId,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onAddressSelectRef = useRef(onAddressSelect)
  onAddressSelectRef.current = onAddressSelect

  const initAutocomplete = useCallback(async () => {
    if (!inputRef.current || !GOOGLE_API_KEY || autocompleteRef.current) return

    try {
      await getLoader()

      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["address_components"],
        }
      )

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.address_components) {
          const fields = parsePlace(place)
          onAddressSelectRef.current(fields)
        }
      })

      autocompleteRef.current = autocomplete
    } catch (err) {
      console.error("Failed to load Google Places:", err)
    }
  }, [])

  useEffect(() => {
    initAutocomplete()
  }, [initAutocomplete])

  return (
    <div className="flex flex-col w-full">
      <div className="flex relative z-0 w-full txt-compact-medium">
        <input
          ref={inputRef}
          type="text"
          name={name}
          placeholder=" "
          required={required}
          autoComplete={autoComplete || "off"}
          value={value}
          onChange={onChange}
          className="pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover"
          data-testid={dataTestId}
        />
        <label
          htmlFor={name}
          onClick={() => inputRef.current?.focus()}
          className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle"
        >
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      </div>
    </div>
  )
}

export default AddressAutocomplete

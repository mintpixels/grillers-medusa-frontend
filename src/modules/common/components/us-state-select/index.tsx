"use client"

import React from "react"
import NativeSelect from "@modules/common/components/native-select"

// USPS 2-letter state + territory codes paired with full names. Sorted
// alphabetically by name. Stored value is the 2-letter code so downstream
// tax / shipping logic gets a normalized value regardless of how a customer
// might type the state name.
const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "PR", name: "Puerto Rico" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

const NAME_TO_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const { code, name } of US_STATES) {
    m[name.toLowerCase()] = code
    m[code.toLowerCase()] = code
  }
  return m
})()

// Normalizes a stored province value to a 2-letter USPS code so old customer
// addresses containing "Georgia" / "GA." / "ga" all resolve to the dropdown's
// "GA" option instead of falling back to the empty placeholder.
export function normalizeStateCode(input?: string | null): string {
  if (!input) return ""
  const cleaned = input.trim().toLowerCase().replace(/\.$/g, "")
  return NAME_TO_CODE[cleaned] || ""
}

type USStateSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "defaultValue" | "value"
> & {
  defaultValue?: string | null
  value?: string | null
  placeholder?: string
}

const USStateSelect = React.forwardRef<HTMLSelectElement, USStateSelectProps>(
  ({ defaultValue, value, placeholder = "State", ...props }, ref) => {
    const normalizedDefault = normalizeStateCode(defaultValue ?? null)
    const normalizedValue = value !== undefined ? normalizeStateCode(value) : undefined

    return (
      <NativeSelect
        ref={ref}
        defaultValue={normalizedValue === undefined ? normalizedDefault : undefined}
        value={normalizedValue}
        placeholder={placeholder}
        {...props}
      >
        {US_STATES.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </NativeSelect>
    )
  }
)

USStateSelect.displayName = "USStateSelect"

export default USStateSelect

"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"
import { useParams, usePathname } from "next/navigation"
import { updateRegion } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type CountryOption = {
  country: string
  region: string
  label: string
}

type HeaderCountrySelectProps = {
  regions: HttpTypes.StoreRegion[]
}

/**
 * Compact country selector for the header
 */
export default function HeaderCountrySelect({ regions }: HeaderCountrySelectProps) {
  const [current, setCurrent] = useState<CountryOption | undefined>(undefined)
  const { countryCode } = useParams()
  const currentPath = usePathname().split(`/${countryCode}`)[1]

  const options = useMemo(() => {
    return regions
      ?.map((r) => {
        return r.countries?.map((c) => ({
          country: c.iso_2,
          region: r.id,
          label: c.display_name,
        }))
      })
      .flat()
      .filter((o): o is CountryOption => !!o)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  useEffect(() => {
    if (countryCode) {
      const option = options?.find((o) => o?.country === countryCode)
      setCurrent(option)
    }
  }, [options, countryCode])

  const handleChange = (option: CountryOption) => {
    updateRegion(option.country, currentPath)
  }

  if (!options || options.length <= 1) {
    // Don't show selector if only one country
    return null
  }

  return (
    <Listbox value={current} onChange={handleChange}>
      {({ open }) => (
        <div className="relative">
          <ListboxButton
            className="flex items-center gap-2 text-p-sm font-maison-neue text-Charcoal hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded px-2 py-1"
            aria-label={`Current shipping country: ${current?.label || "Select country"}`}
          >
            {current && (
              <>
                {/* @ts-ignore */}
                <ReactCountryFlag
                  svg
                  style={{
                    width: "20px",
                    height: "15px",
                  }}
                  countryCode={current.country}
                  aria-hidden="true"
                />
                <span className="hidden lg:inline">{current.label}</span>
              </>
            )}
            <Image
              src="/images/icons/chevron.svg"
              width={10}
              height={5}
              alt=""
              aria-hidden="true"
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </ListboxButton>

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <ListboxOptions
              className="absolute right-0 mt-2 w-56 max-h-60 overflow-auto bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 rounded"
              aria-label="Select shipping country"
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.country}
                  value={option}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 px-4 flex items-center gap-3 ${
                      active ? "bg-gray-100" : ""
                    } ${current?.country === option.country ? "font-semibold" : ""}`
                  }
                >
                  {/* @ts-ignore */}
                  <ReactCountryFlag
                    svg
                    style={{
                      width: "20px",
                      height: "15px",
                    }}
                    countryCode={option.country}
                    aria-hidden="true"
                  />
                  <span className="text-p-sm font-maison-neue text-Charcoal">
                    {option.label}
                  </span>
                  {current?.country === option.country && (
                    <span className="ml-auto text-Gold" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}

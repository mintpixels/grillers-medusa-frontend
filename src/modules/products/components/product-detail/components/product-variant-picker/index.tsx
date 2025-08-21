"use client"

import React from "react"
import classNames from "classnames"
import { HttpTypes } from "@medusajs/types"
import { CheckMini } from "@medusajs/icons"
import { getProductPrice } from "@lib/util/get-product-price"

type Props = {
  product: HttpTypes.StoreProduct
  options: Record<string, string>
  setOptionValue: (optionId: string, value: string) => void
  showPrices?: boolean
}

/** Map variant options -> keymap */
const keymap = (opts: HttpTypes.StoreProductVariant["options"]) =>
  (opts ?? []).reduce((acc: Record<string, string>, o: any) => {
    if (o?.option_id) acc[o.option_id] = o.value
    return acc
  }, {})

/** Check stock/backorder for a variant */
const isVariantPurchasable = (v?: HttpTypes.StoreProductVariant | null) => {
  if (!v) return false
  if (!v.manage_inventory) return true
  if (v.allow_backorder) return true
  return (v.inventory_quantity || 0) > 0
}

/** Return the variant that matches current partial selection plus a candidate value */
const matchVariantFor = ({
  product,
  optionId,
  value,
  current,
}: {
  product: HttpTypes.StoreProduct
  optionId: string
  value: string
  current: Record<string, string>
}) => {
  return (product.variants ?? []).find((v) => {
    const km = keymap(v.options)
    if (km[optionId] !== value) return false
    for (const [k, vSel] of Object.entries(current)) {
      if (!vSel || k === optionId) continue
      if (km[k] !== vSel) return false
    }
    return true
  })
}

/** Unique values for a given product option id (keeps variant order) */
const valuesForOption = (product: HttpTypes.StoreProduct, optionId: string) => {
  const seen = new Set<string>()
  const vals: string[] = []
  for (const v of product.variants ?? []) {
    const val = v.options?.find((o: any) => o.option_id === optionId)?.value
    if (val && !seen.has(val)) {
      seen.add(val)
      vals.push(val)
    }
  }
  return vals
}

export default function ProductVariantPicker({
  product,
  options,
  setOptionValue,
  showPrices = false,
}: Props) {
  const productOptions = product?.options ?? []
  const variants = product?.variants ?? []

  // Hide when no options or only one purchasable variant
  if (!productOptions.length || variants.length <= 1) return null

  return (
    <div className="mb-2">
      {productOptions.map((opt) => {
        const values = valuesForOption(product, opt.id)
        if (!values.length) return null

        const selected = options[opt.id]

        return (
          <div
            key={opt.id}
            role="group"
            aria-label={opt.title}
            className="mb-4"
          >
            <p className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal mb-2">
              {opt.title}:
            </p>

            <ul
              role="radiogroup"
              aria-labelledby={`variant-${opt.id}-label`}
              className="flex flex-wrap gap-2"
            >
              {values.map((val) => {
                const candidate = matchVariantFor({
                  product,
                  optionId: opt.id,
                  value: val,
                  current: options,
                })
                const available = isVariantPurchasable(candidate)
                const active = selected === val

                const price =
                  showPrices && candidate
                    ? getProductPrice({
                        product,
                        variantId: candidate.id,
                      })?.variantPrice?.calculated_price
                    : undefined

                const btnClass = classNames(
                  "px-4 py-2 min-w-16 rounded-full border text-p-md font-maison-neue transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-IsraelBlue/60",
                  active
                    ? "border-Charcoal bg-Charcoal text-white"
                    : "border-Charcoal/90 hover:border-Charcoal",
                  !available && "opacity-50 cursor-not-allowed"
                )

                return (
                  <li key={val}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-disabled={!available}
                      disabled={!available}
                      onClick={() => available && setOptionValue(opt.id, val)}
                      className={btnClass}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {active && <CheckMini className="h-3 w-3 text-white" />}
                        <span className="text-p-md-bold">{val}</span>
                        {price && (
                          <span className="text-p-sm-mono">{price}</span>
                        )}
                        {!available && (
                          <span className="text-p-sm-mono">Sold out</span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

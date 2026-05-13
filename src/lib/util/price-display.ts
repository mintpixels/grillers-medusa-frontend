import skuPricingModeMap from "@lib/data/pricing-mode-by-sku.json"

/**
 * Price-display helper for product cards and PDPs.
 *
 * Two pricing modes per SKU, sourced from QuickBooks via the Conductor
 * sync (custom field on each item). Until that sync populates Strapi's
 * `MedusaProduct.PricingMode` field, we fall back to a hand-derived
 * SKU→mode map (`pricing-mode-by-sku.json`) built from the v2 price
 * list (heuristic: empty `$/lb` column = fixed_price).
 *
 *   - **`per_lb`** (variable / catch-weight) — customer pays $/lb ×
 *     actual pack weight at packing. PDP shows:
 *
 *       $3.98 / LB
 *       Estimated $4.78 for a ~1.2 lb pack
 *
 *       [ ADD TO CART — $4.78 ]
 *
 *     Add-to-Cart shows the estimated pack total; Final billed price
 *     reflects the actual weight (see CatchWeightBadge).
 *
 *   - **`fixed_price`** — customer pays the pack price as printed.
 *     No multiplication. PDP shows:
 *
 *       $25.00
 *       Each — fixed price
 *
 *       [ ADD TO CART — $25.00 ]
 *
 * Resolution order:
 *
 *   1. Explicit `Metadata.PricingMode` (Strapi, eventually QB-driven).
 *   2. SKU lookup in `pricing-mode-by-sku.json` (CSV-derived map).
 *   3. Weight-based heuristic: if the parsed weight is ≥ 0.95 lb,
 *      assume `per_lb`; otherwise `fixed_price`. This handles the
 *      "16 oz pack = 1 lb" case (#31 / #104 follow-up) — those used
 *      to render as fixed_price because the weight string was in
 *      oz, but the catalog actually prices them per pound.
 */

export type PriceDisplayMode = "per_lb" | "fixed_price"

/**
 * Minimal shape `formatProductPriceDisplay` actually reads. Lets both
 * the full Strapi `Metadata` (types/strapi.ts) and the narrower
 * `ProductMetadata` from the SWR hook satisfy the param without
 * casting at the call site.
 */
type PriceDisplayMetadata = {
  AvgPackWeight?: string | null
  PricingMode?: PriceDisplayMode
}

export type PriceDisplay = {
  /** Resolved mode (per-lb or fixed). */
  mode: PriceDisplayMode
  /** Headline price text (e.g. `$3.98` or `$25.00`). */
  primary: string
  /** Optional label following the headline (e.g. `/ LB`). Empty for fixed. */
  primaryLabel: string
  /** Sub-line — context + math. Empty when there's nothing to say. */
  secondary: string
  /** Estimated pack total in dollars (per-lb mode) — Add-to-Cart shows this. */
  estimatedPackPrice: number
}

type ParsedWeight = {
  /** Lower bound in pounds; equal to `hi` for single-weight items. */
  lo: number
  /** Upper bound in pounds. */
  hi: number
  /** Midpoint in pounds — used for $/lb math on catch-weight items. */
  avg: number
  /** True when the original weight was expressed in oz / count, not lb. */
  ozOrCount: boolean
}

/**
 * Parse `AvgPackWeight` strings the Strapi catalog ships. Examples:
 *   "14-17 lb."         → range of lb
 *   "5-6 lb"            → range of lb
 *   "1 lb."             → single lb
 *   "1.75 lb."          → single lb (fractional)
 *   "28 oz."            → single oz
 *   "16 oz."            → single oz (== 1 lb)
 *   "2x ~7 oz."         → multi-pack of oz
 *   "3.5-5.5 lb."       → fractional range
 */
export function parseAvgPackWeight(
  input: string | null | undefined
): ParsedWeight | null {
  if (!input) return null
  const cleaned = input.trim().toLowerCase().replace(/[~]/g, "")

  // Range of lb: "14-17 lb"
  const lbRange = cleaned.match(
    /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*(lb|lbs|pound|pounds)/
  )
  if (lbRange) {
    const lo = parseFloat(lbRange[1])
    const hi = parseFloat(lbRange[2])
    if (lo > 0 && hi > 0) {
      return { lo, hi, avg: (lo + hi) / 2, ozOrCount: false }
    }
  }

  // Single lb: "1 lb", "1.75 lb."
  const lbSingle = cleaned.match(/(\d+\.?\d*)\s*(lb|lbs|pound|pounds)\.?/)
  if (lbSingle) {
    const v = parseFloat(lbSingle[1])
    if (v > 0) return { lo: v, hi: v, avg: v, ozOrCount: false }
  }

  // Oz range: "11-13 oz", "14-16 oz."
  const ozHyphenRange = cleaned.match(
    /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*oz/
  )
  if (ozHyphenRange) {
    const loOz = parseFloat(ozHyphenRange[1])
    const hiOz = parseFloat(ozHyphenRange[2])
    if (loOz > 0 && hiOz > 0) {
      return {
        lo: loOz / 16,
        hi: hiOz / 16,
        avg: (loOz + hiOz) / 2 / 16,
        ozOrCount: true,
      }
    }
  }

  // Oz / count-based: "28 oz", "2x ~7 oz"
  const ozRange = cleaned.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*oz/)
  if (ozRange) {
    const count = parseFloat(ozRange[1])
    const each = parseFloat(ozRange[2])
    const totalLb = (count * each) / 16
    if (totalLb > 0) {
      return { lo: totalLb, hi: totalLb, avg: totalLb, ozOrCount: true }
    }
  }
  const ozSingle = cleaned.match(/(\d+\.?\d*)\s*oz/)
  if (ozSingle) {
    const oz = parseFloat(ozSingle[1])
    if (oz > 0) {
      return { lo: oz / 16, hi: oz / 16, avg: oz / 16, ozOrCount: true }
    }
  }

  return null
}

function dollars(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "$0.00"
  return `$${n.toFixed(2)}`
}

function tidyWeight(raw: string): string {
  return raw.trim().replace(/\.\s*$/, "")
}

const SKU_PRICING_MODE_MAP = skuPricingModeMap as Record<string, PriceDisplayMode>

/**
 * Resolve `per_lb` vs `fixed_price` for a SKU.
 *
 * 1. Explicit Strapi field (either `Metadata.PricingMode` or
 *    `MedusaProduct.PricingMode` — both are honored so backfills can
 *    land on either component without breaking the resolver).
 * 2. Otherwise look up the SKU in the bundled QB-derived map
 *    (`pricing-mode-by-sku.json`).
 * 3. Otherwise heuristic by weight (≥0.95 lb → per_lb).
 */
export function resolvePricingMode(
  metadata: PriceDisplayMetadata | null | undefined,
  sku: string | null | undefined,
  parsedWeight: ParsedWeight | null,
  explicitMode?: PriceDisplayMode | null
): PriceDisplayMode {
  if (explicitMode === "per_lb" || explicitMode === "fixed_price") return explicitMode
  const fromMetadata = (metadata as { PricingMode?: PriceDisplayMode } | null | undefined)
    ?.PricingMode
  if (fromMetadata === "per_lb" || fromMetadata === "fixed_price") return fromMetadata
  const fromMap = sku ? SKU_PRICING_MODE_MAP[sku] : undefined
  if (fromMap === "per_lb" || fromMap === "fixed_price") return fromMap
  if (parsedWeight && parsedWeight.avg >= 0.95) return "per_lb"
  return "fixed_price"
}

/**
 * Compute the display block for a product price.
 *
 * @param packPrice    - the Medusa pack price (dollars). For per_lb items
 *                       this is the est. pack total ($/lb × midpoint
 *                       weight, sourced from QB).
 * @param metadata     - Strapi `Metadata` (looks at `AvgPackWeight` and
 *                       `PricingMode` when present).
 * @param sku          - the SKU code (used for the static map fallback).
 * @param explicitMode - explicit `MedusaProduct.PricingMode` from Strapi
 *                       when the caller has it. Takes priority over
 *                       `metadata.PricingMode` so backfills on either
 *                       component just work.
 */
export function formatProductPriceDisplay(
  packPrice: number,
  metadata: PriceDisplayMetadata | null | undefined,
  sku?: string | null,
  explicitMode?: PriceDisplayMode | null
): PriceDisplay {
  if (!Number.isFinite(packPrice) || packPrice <= 0) {
    return {
      mode: "fixed_price",
      primary: "$0.00",
      primaryLabel: "",
      secondary: "",
      estimatedPackPrice: 0,
    }
  }

  const weight = parseAvgPackWeight(metadata?.AvgPackWeight)
  const mode = resolvePricingMode(metadata, sku, weight, explicitMode)

  // Fixed-price treatment: pack price as headline, no math.
  if (mode === "fixed_price") {
    return {
      mode: "fixed_price",
      primary: dollars(packPrice),
      primaryLabel: "",
      secondary: "Each, fixed price",
      estimatedPackPrice: packPrice,
    }
  }

  // Per-lb treatment. If we don't have a usable weight, we can't show
  // the math, so degrade to a simple `$X.XX / LB` headline.
  if (!weight) {
    return {
      mode: "per_lb",
      primary: dollars(packPrice),
      primaryLabel: "/ LB",
      secondary: "",
      estimatedPackPrice: packPrice,
    }
  }

  const perLb = packPrice / weight.avg
  const tidyRange = tidyWeight(metadata?.AvgPackWeight as string)

  // Format the weight summary for the "Estimated $X for a … pack" line.
  //   range:           "14-17 lb"            (no ~ — the range itself
  //                                           communicates approx)
  //   single (lb):     "~1.2 lb"             (~ because the actual pack
  //                                           weight varies a bit)
  //   single (oz≥1lb): "~1.00 lb"            (rounded equivalent)
  //   sub-lb oz:       falls back to the     ("~7 oz", etc.)
  //                    raw oz-shaped string
  const lbDisplay = (() => {
    if (weight.hi > weight.lo + 1e-6) return tidyRange
    if (weight.ozOrCount && weight.avg < 0.95) return tidyRange
    // Strip trailing zeros on the single-weight figure so `1.2 lb` doesn't
    // render as `1.20 lb`.
    const n = weight.avg
    const decimals = n >= 10 ? 0 : 1
    const rounded = n.toFixed(decimals).replace(/\.0$/, "")
    return `~${rounded} lb`
  })()

  return {
    mode: "per_lb",
    primary: dollars(perLb),
    primaryLabel: "/ LB",
    secondary: `Estimated ${dollars(packPrice)} for a ${lbDisplay} pack`,
    estimatedPackPrice: packPrice,
  }
}

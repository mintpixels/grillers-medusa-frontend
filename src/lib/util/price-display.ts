/**
 * Price-display helper that turns a Medusa pack price + Strapi
 * `AvgPackWeight` string into a two-line product price block.
 *
 * Catch-weight catalog rules (per #31 + #104, grounded in
 * `analysis/gp-price-list-final-2026-04-27.csv`):
 *
 *   1. Items with a WEIGHT RANGE in `AvgPackWeight` (e.g. "14-17 lb.")
 *      are catch-weight: the customer pays $/lb × actual weight at
 *      packing. Pack price is the est-pack subtotal. We render the
 *      $/lb rate as the HEADLINE and the est. pack price as the
 *      SECONDARY line, so the customer never reads "$227 per lb" on
 *      a 15-20 lb brisket.
 *
 *   2. Items with a SINGLE lb weight (e.g. "1 lb.", "1.75 lb.") are
 *      per-pound priced too — Pack Price equals $/lb in the CSV. Same
 *      headline ($/lb) but no redundant pack-price secondary.
 *
 *   3. Items with an OZ-only or count-based weight (e.g. "28 oz.",
 *      "2x ~7 oz.") are per-pack priced — the pack price IS the
 *      checkout price; per-lb math is meaningless on a 0.4 lb
 *      lamb-chop two-pack. Render headline as the pack price with NO
 *      "/lb" label, and the weight summary as the secondary line.
 *      (This is exactly the case Mike Salguero caught — lamb chops
 *      `3-01-14-1` showing `$22.74 per lb` instead of `$22.74 per
 *      pack`.)
 *
 *   4. Items with no `AvgPackWeight` fall back to rule #3 — pack
 *      price only, no `/lb`.
 *
 * The helper returns a normalized shape so PLP cards, the PDP price
 * block, search results, and cart line items all render the same
 * decision. Anything that wants more compact rendering can drop the
 * `secondary` line on its own; the *labels* and the math don't move.
 */

export type PriceDisplayMode = "per-lb" | "per-pack"

export type PriceDisplay = {
  /** Mode the helper resolved the item into. */
  mode: PriceDisplayMode
  /** Headline price string, formatted with $ sign and two decimals. */
  primary: string
  /** Headline label — "/ lb" for per-lb mode, "" for per-pack. */
  primaryLabel: string
  /** Secondary line — empty string when there's no useful sub-line. */
  secondary: string
}

type ParsedWeight = {
  /** Lower bound in pounds; equal to `hi` for single-weight items. */
  lo: number
  /** Upper bound in pounds. */
  hi: number
  /** Midpoint in pounds — used for $/lb calc on catch-weight items. */
  avg: number
  /** True when the original weight was expressed in oz / count, not lb. */
  ozOrCount: boolean
}

/**
 * Parse `AvgPackWeight` strings the Strapi catalog ships.
 *
 * Matches we care about, with examples from the v2 price list:
 *   "14-17 lb."         → range of lb
 *   "5-6 lb"            → range of lb (no trailing period)
 *   "1 lb."             → single lb
 *   "1.75 lb."          → single lb (fractional)
 *   "28 oz."            → single oz → returns oz-mode
 *   "2x ~7 oz."         → multi-pack of oz → oz-mode (counts the oz value)
 *   "3.5-5.5 lb."       → fractional range
 */
export function parseAvgPackWeight(input: string | null | undefined): ParsedWeight | null {
  if (!input) return null
  const cleaned = input.trim().toLowerCase().replace(/[~]/g, "")

  // Range of lb: "14-17 lb", "3.5-5.5 lb."
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

  // Oz or count-based: "28 oz", "2x ~7 oz" — convert to lb for math but
  // mark `ozOrCount` so the renderer knows the item is per-pack, not /lb.
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

/** Format a number into a `$X.XX` string. Tolerates negative / NaN by returning $0.00. */
function dollars(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "$0.00"
  return `$${n.toFixed(2)}`
}

/** Normalize the AvgPackWeight string for display ("1.75 lb." → "1.75 lb"). */
function tidyWeight(raw: string): string {
  return raw.trim().replace(/\.\s*$/, "")
}

/**
 * Compute the canonical display block for a product price.
 *
 * @param packPrice - the Medusa pack price (e.g. 227.33 for a brisket)
 * @param avgPackWeight - the Strapi `Metadata.AvgPackWeight` string
 *                        (e.g. "15-20 lb.", "1 lb.", "28 oz.")
 */
export function formatProductPriceDisplay(
  packPrice: number,
  avgPackWeight: string | null | undefined
): PriceDisplay {
  if (!Number.isFinite(packPrice) || packPrice <= 0) {
    return { mode: "per-pack", primary: "$0.00", primaryLabel: "", secondary: "" }
  }
  const weight = parseAvgPackWeight(avgPackWeight)

  // No usable weight info → fall through to per-pack display.
  if (!weight) {
    return {
      mode: "per-pack",
      primary: dollars(packPrice),
      primaryLabel: "",
      secondary: "",
    }
  }

  const tidy = tidyWeight(avgPackWeight as string)

  // Oz / count-based items → per-pack display, no /lb misread.
  if (weight.ozOrCount) {
    return {
      mode: "per-pack",
      primary: dollars(packPrice),
      primaryLabel: "",
      secondary: `${tidy} pack`,
    }
  }

  const perLb = packPrice / weight.avg

  // Catch-weight range (lo < hi) → $/lb headline + est. pack secondary.
  if (weight.hi > weight.lo + 1e-6) {
    return {
      mode: "per-lb",
      primary: dollars(perLb),
      primaryLabel: "/ lb",
      secondary: `est. ${dollars(packPrice)} / pack · ${tidy}`,
    }
  }

  // Single-lb item → $/lb headline; no redundant secondary because pack == /lb.
  return {
    mode: "per-lb",
    primary: dollars(perLb),
    primaryLabel: "/ lb",
    secondary: "",
  }
}

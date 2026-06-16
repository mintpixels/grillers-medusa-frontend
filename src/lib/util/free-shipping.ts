/**
 * Free-shipping logic for Grillers Pride (#83).
 *
 * Source of truth — `analysis/free-shipping-regional-vs-national-boundaries-2026-05-06.md`:
 *
 *   - **Plant Pickup (Doraville, GA)**: always free. Customer earns a
 *     $7.50 pickup credit on orders ≥ $150.
 *   - **Atlanta Delivery / Southeast Pickup / UPS shipping to in-region
 *     state**: free at $250+. The 7 in-region states are
 *     `GA, TN, TX, NC, FL, SC, AL`.
 *   - **UPS shipping to a national state**: free at $500+. The checkout
 *     service picker decides whether Ground or 3 Day Select is the baseline.
 *   - **UPS Overnight**: never free; charged at carrier rate.
 *
 * The threshold is determined by the **ship-to state** plus the
 * **fulfillment method**, NOT the customer's billing state.
 *
 * This module exposes:
 *
 *   - `IN_REGION_STATES`, `IN_REGION_THRESHOLD`, `NATIONAL_THRESHOLD`,
 *     `PICKUP_BONUS_THRESHOLD`, `PICKUP_BONUS_AMOUNT`
 *   - `isInRegionState(state)` — boolean
 *   - `getFreeShippingState(input)` — pure decision function used by
 *     every UI surface that needs to render shipping copy.
 *
 * The React-flavored helper `<FreeShippingHelper>` in
 * `modules/common/components/cart-helpers` consumes
 * `getFreeShippingState` so server-side templates, the side cart, the
 * PDP, and the cart-page all stay in lockstep.
 */

export const IN_REGION_STATES = [
  "GA",
  "TN",
  "TX",
  "NC",
  "FL",
  "SC",
  "AL",
] as const

export const IN_REGION_THRESHOLD = 250
export const NATIONAL_THRESHOLD = 500
export const PICKUP_BONUS_THRESHOLD = 150
export const PICKUP_BONUS_AMOUNT = 7.5

/**
 * #266: a Strapi-editable threshold override is honored only when it's a finite
 * POSITIVE number. `null`/`undefined` (field not deployed/populated) — and also
 * a `0`, negative, or `NaN` (misconfiguration) — falls back to the hardcoded
 * constant, so a bad Strapi value can never collapse the threshold to "free on
 * everything". Shared by the UI (getFreeShippingState) and the promo gate
 * (free-shipping-promo.ts) so display and applied discount stay consistent.
 */
export function resolveFreeShippingThreshold(
  override: number | null | undefined,
  fallback: number
): number {
  return typeof override === "number" &&
    Number.isFinite(override) &&
    override > 0
    ? override
    : fallback
}

export type FulfillmentType =
  | "ups_shipping"
  | "ups_overnight"
  | "atlanta_delivery"
  | "southeast_pickup"
  | "plant_pickup"
  | string
  | null
  | undefined

export type FreeShippingKind =
  | "plant_pickup"
  | "atlanta_delivery"
  | "southeast_pickup"
  | "in_region_ups"
  | "national_ups"
  | "overnight"
  | "ambiguous"

export type FreeShippingState = {
  /** Which threshold rule applies, given the resolved fulfillment + ship-to. */
  kind: FreeShippingKind
  /** Dollar threshold the customer's `subtotal` must clear. `null` for never-free or always-free. */
  threshold: number | null
  /** True when the current `subtotal` qualifies for free shipping (or always-free). */
  qualified: boolean
  /** Dollars remaining to clear the threshold; `0` once qualified or when there's no threshold. */
  remaining: number
  /** 0..100; useful for thermometer progress bars. */
  remainingPercentage: number
  /** True for plant pickup specifically — there's a pickup credit incentive. */
  isPlantPickup: boolean
  /** True when the customer has cleared the pickup bonus threshold (only used for plant pickup). */
  pickupBonusEarned: boolean
  /** Dollars remaining to earn the pickup bonus credit; `0` once earned or not applicable. */
  pickupBonusRemaining: number
}

export function isInRegionState(state: string | null | undefined): boolean {
  if (!state) return false
  return (IN_REGION_STATES as readonly string[]).includes(state.toUpperCase())
}

/**
 * Resolve the free-shipping state for the given cart context. Inputs:
 *
 *   - `subtotal` — current cart item total in dollars. `null` / `undefined`
 *     treated as 0 (pre-cart pages).
 *   - `fulfillmentType` — the cart's selected fulfillment method. When
 *     omitted, we fall back to ship-state inference (in-region vs
 *     national UPS Ground).
 *   - `shipState` — 2-letter US state code from the ship-to address.
 *     Optional pre-checkout.
 */
export function getFreeShippingState(input: {
  subtotal?: number | null
  fulfillmentType?: FulfillmentType
  shipState?: string | null
  /**
   * Strapi-editable in-region free-shipping threshold (#266). When `null`/
   * `undefined` (Strapi field not deployed/populated) we fall back to the
   * hardcoded `IN_REGION_THRESHOLD` constant.
   */
  inRegionThreshold?: number | null
  /** Strapi-editable national free-shipping threshold (#266). Falls back to
   * `NATIONAL_THRESHOLD`. */
  nationalThreshold?: number | null
}): FreeShippingState {
  const sub = Math.max(0, input.subtotal ?? 0)

  // Plant pickup — always free; threshold tracking is for the bonus.
  if (input.fulfillmentType === "plant_pickup") {
    const earned = sub >= PICKUP_BONUS_THRESHOLD
    return {
      kind: "plant_pickup",
      threshold: null,
      qualified: true,
      remaining: 0,
      remainingPercentage: 100,
      isPlantPickup: true,
      pickupBonusEarned: earned,
      pickupBonusRemaining: earned
        ? 0
        : Math.max(0, PICKUP_BONUS_THRESHOLD - sub),
    }
  }

  // Overnight is never free; threshold logic doesn't apply.
  if (input.fulfillmentType === "ups_overnight") {
    return {
      kind: "overnight",
      threshold: null,
      qualified: false,
      remaining: 0,
      remainingPercentage: 0,
      isPlantPickup: false,
      pickupBonusEarned: false,
      pickupBonusRemaining: 0,
    }
  }

  if (!input.fulfillmentType && !input.shipState) {
    return {
      kind: "ambiguous",
      threshold: null,
      qualified: false,
      remaining: 0,
      remainingPercentage: 0,
      isPlantPickup: false,
      pickupBonusEarned: false,
      pickupBonusRemaining: 0,
    }
  }

  // Atlanta delivery / Southeast pickup / in-region UPS shipping → $250.
  // National UPS shipping → $500.
  const inRegion =
    input.fulfillmentType === "atlanta_delivery" ||
    input.fulfillmentType === "southeast_pickup" ||
    isInRegionState(input.shipState)

  // #266: prefer the Strapi-editable thresholds when supplied; a null/0/invalid
  // value safely falls back to the hardcoded constant (see resolveFreeShippingThreshold).
  const threshold = inRegion
    ? resolveFreeShippingThreshold(input.inRegionThreshold, IN_REGION_THRESHOLD)
    : resolveFreeShippingThreshold(input.nationalThreshold, NATIONAL_THRESHOLD)
  const qualified = sub >= threshold
  const remaining = qualified ? 0 : Math.max(0, threshold - sub)
  const remainingPercentage = Math.min(
    100,
    Math.max(0, (sub / threshold) * 100)
  )

  return {
    kind:
      input.fulfillmentType === "atlanta_delivery"
        ? "atlanta_delivery"
        : input.fulfillmentType === "southeast_pickup"
          ? "southeast_pickup"
          : inRegion
            ? "in_region_ups"
            : input.shipState
              ? "national_ups"
              : "ambiguous",
    threshold,
    qualified,
    remaining,
    remainingPercentage,
    isPlantPickup: false,
    pickupBonusEarned: false,
    pickupBonusRemaining: 0,
  }
}

/**
 * Compact plain-text rendering of `getFreeShippingState`. Useful where
 * we can't render React (server actions building toast messages, email
 * templates, JSON-LD). The default React `<FreeShippingHelper>` is
 * richer.
 */
export function freeShippingPlainText(input: {
  subtotal?: number | null
  fulfillmentType?: FulfillmentType
  shipState?: string | null
  inRegionThreshold?: number | null
  nationalThreshold?: number | null
}): string {
  // `getFreeShippingState` already applies the threshold defaulting; this
  // helper renders off the resolved state (`s.remaining`/`s.threshold`), so it
  // just needs to forward the optional Strapi thresholds. #266.
  const s = getFreeShippingState(input)
  const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`

  if (s.isPlantPickup) {
    return s.pickupBonusEarned
      ? `Pickup is always free. You've earned a $${PICKUP_BONUS_AMOUNT.toFixed(
          2
        )} pickup credit.`
      : `Pickup is always free. ${fmt(s.pickupBonusRemaining)} away from a $${PICKUP_BONUS_AMOUNT.toFixed(2)} credit.`
  }
  if (s.kind === "overnight") {
    return "UPS Overnight is charged at the carrier rate."
  }
  if (s.qualified) {
    if (s.kind === "atlanta_delivery") return "Your order qualifies for free local delivery."
    if (s.kind === "southeast_pickup") return "Your order qualifies for free regional pickup."
    if (s.kind === "in_region_ups") return "Your order qualifies for the regional free-delivery threshold."
    return "Your order qualifies for free UPS cold-chain shipping."
  }
  if (s.kind === "ambiguous") {
    return "Enter your ZIP or choose fulfillment to see whether free local delivery, regional pickup, or UPS shipping applies."
  }
  const label =
    s.kind === "national_ups"
      ? "free UPS cold-chain shipping"
      : s.kind === "southeast_pickup"
        ? "free regional pickup"
        : s.kind === "atlanta_delivery"
          ? "free local delivery"
          : "the regional free-delivery threshold"
  return `You're ${fmt(s.remaining)} away from ${label}.`
}

# 05 — Pricing & Catch-Weight

**Load-bearing.** Mis-rendering a price has historically caused two customer complaints and one round of refunds. Read this in full before touching any price-rendering code.

## The two pricing modes

Every SKU in the catalog has one of two modes:

| Mode | What customer sees | What they pay |
|---|---|---|
| `per_lb` (catch-weight) | `$X.XX / LB` + `Estimated $Y for a Z lb pack` | `$/lb × actual pack weight` (charged at fulfillment) |
| `fixed_price` | `$X.XX` + `Each — fixed price` | The printed pack price (regardless of weight) |

Mixing them is the regression class. Examples that have shipped wrong in prod:
- Kosher Deli Rolls (`10-08-22-1`) — fixed-price prepared food with `AvgPackWeight="4.6 lb"` set. Old code keyed on "weight is present → must be per-lb" and divided the pack price by 4.6, showing a phantom `$X/lb`.
- Mike Salguero's brisket (`1-04-11-1`) — true catch-weight 15-20 lb. Wrong code branch rendered the cheapest-variant fixed price as a single number, no `/lb` label.

## The resolver — `formatProductPriceDisplay`

There is exactly ONE place where pricing mode is decided: `src/lib/util/price-display.ts`. Every surface that renders a customer-facing price MUST call this.

```ts
import { formatProductPriceDisplay } from "@lib/util/price-display"

const display = formatProductPriceDisplay(
  packPrice,            // unit_amount from Medusa, in cents
  metadata,             // Strapi MedusaProduct.Metadata (may have AvgPackWeight)
  sku,                  // the price-owning SKU (see "Which SKU?" below)
  strapiProductData?.MedusaProduct?.PricingMode  // explicitMode, optional
)

// display = {
//   primary: "$5.99",          // or "$5.99"
//   primaryLabel: "/LB" | undefined,
//   secondary: "Estimated $44.99 for a 7.5 lb pack" | undefined,
// }
```

**Render it as:**

```jsx
<span className="text-h4 font-gyst">{display.primary}</span>
{display.primaryLabel && (
  <span className="text-p-sm-mono ml-1 uppercase">{display.primaryLabel}</span>
)}
{display.secondary && <p className="text-xs ...">{display.secondary}</p>}
```

## Resolution order (4 layers, top wins)

1. **`explicitMode` parameter** — passed in from Strapi `MedusaProduct.PricingMode`. The eventual authoritative path once the Strapi backfill is complete (#131).
2. **`metadata.PricingMode`** — forward-compat path; nested under Strapi `Metadata.PricingMode`.
3. **Bundled JSON map at `src/lib/data/pricing-mode-by-sku.json`** — currently the authoritative source. 1,726 entries from a QB Conductor pull. 99.2% storefront coverage. **Updated via the pattern in `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-cloud-deploy-quirks.md`.**
4. **Weight heuristic fallback** — `parsedAvgPackWeight.avg ≥ 0.95 lb → per_lb`, else `fixed_price`.

When all four are null/unset, default to `fixed_price`. **Overcharging is worse than undercharging** — better to render a fixed pack price for an actual catch-weight item than to render a phantom $/lb for a fixed-price item.

## Which SKU is the "price-owner"?

For multi-variant products (e.g. SKU pairs `8-01-11-1` and `8-01-11-1P`), the cheapest variant is NOT necessarily `variants[0]`. **Don't pass `product.variants[0].sku` to the resolver.**

Use `getProductPrice` (in `src/lib/util/get-product-price.ts`), which returns:
- `cheapestVariantSku` — for PLP cards and search dropdowns (rendering the entry price)
- `selectedVariantSku` — for PDPs once the customer has chosen a variant (rendering the variant price)

The price returned by `getProductPrice` is owned by that SKU, so the resolver mode lookup must use the SAME sku.

## Every customer-facing price surface (audit list, May 2026)

All of these route through `formatProductPriceDisplay`. **If you add a new surface, append it to the bottom of this list and update the memory page.**

| Surface | File |
|---|---|
| PDP | `src/modules/products/components/product-detail/components/product-price/index.tsx` |
| PDP sticky bar (mobile) | `src/modules/products/components/product-price/index.tsx` |
| Product preview card | `src/modules/products/components/product-preview/price.tsx` + `index.tsx` |
| PLP grid + list | `src/modules/collections/components/strapi-product-grid.tsx` |
| Algolia search card | `src/modules/algolia/components/product-card/index.tsx` |
| Side-cart drawer | `src/modules/layout/components/side-cart/index.tsx` |
| Full cart line item | `src/modules/cart/components/item/index.tsx` (also gates `NetWeightPricing` block on resolver mode) |
| Desktop search autocomplete | `src/modules/layout/templates/nav/search-bar.tsx` |
| Mobile search autocomplete | `src/modules/layout/templates/nav/mobile-search.tsx` |

## Regression patterns to grep for

When auditing OR reviewing a diff that touches price code:

```bash
# Bypass pattern: low-level currency format + hardcoded /lb label
grep -rn "convertToLocale\|formatPrice" src/ | grep -iE "/lb|per lb|\$.*lb"

# Bypass pattern: NetWeightPricing gated on weight presence alone
grep -rn "AvgPackWeight" src/ | grep -v "price-display"

# Bypass pattern: variants[0].sku passed to anything price-related
grep -rn "variants\[0\]\.sku" src/
```

Any hit OTHER than `price-display.ts` itself or `get-product-price.ts` is suspicious.

## The two-pass Codex review rule

For any change to `price-display.ts`, `get-product-price.ts`, or `formatProductPriceDisplay` callers:

1. **First pass:** `/codex:review` on the diff — catches diff-level issues.
2. **Second pass:** Explicit "find every consumer" prompt — *"Audit every file that imports `formatProductPriceDisplay`. For each, verify it routes the cheapest/selected variant SKU through correctly. Find any surface that bypasses the helper with raw `convertToLocale` + hardcoded label."*

This is non-negotiable. The May 2026 `#104/#31` fix passed the first review clean → closed both issues → second review found FOUR P1/P2 bypass sites (commit `bf5a74b`) that would have reproduced Peter's `10-08-22-1` bug.

## Related

- `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/pricing-mode-resolver-pattern.md` — the source-of-truth memory page
- `~/.claude/rules/ship-an-issue-validation-gate.md` § "One adversarial review isn't enough when the change touches a shared abstraction"
- `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-cloud-deploy-quirks.md` — why the JSON file is authoritative today
- [[06-critical-traps]] § Strapi
- [[07-shipping-an-issue]]

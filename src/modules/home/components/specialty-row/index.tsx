import strapiClient from "@lib/strapi"
import { getProductsByHandlesStrict } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { compactCollectionProducts } from "@lib/util/collection-product"
import { emitHomepageProductRailFailureAlert } from "@lib/homepage-ops-alerts"
import { suppressInvalidProductTag } from "@lib/util/product-claims"
import SpecialtySwiper from "./swiper"

/**
 * "Specialty cuts you can't get from your supermarket" — homepage row for
 * #98. Manually curated; refresh seasonally. Should eventually move to a
 * Strapi ComponentHomeSpecialty section so editors can rotate without a
 * code deploy.
 *
 * Stable identifier: Medusa handle. Earlier this was indexed by Strapi
 * entry `id` (an auto-increment integer), but Strapi 5 assigns a new id
 * to each new published revision — so after any backfill / re-publish
 * operation, the integer ids in code can fall out of sync with the
 * live entries. Handles come from Medusa, are stable across Strapi
 * revisions, and are what the rest of the storefront uses anyway.
 */
const SPECIALTY_PRODUCT_HANDLES = [
  // Kosher Beef Biltong Slices, Regular · 3 oz
  "beef-biltong-slices-regular-south-african-beef-jerky-3-oz-not-kosher-for-passover",
  // Kosher KosherBoeries Classic Beef Boerewors (6×4 oz)
  "kosherboeries-authentic-south-african-beef-grilling-sausages-no-nitrates-classic-6-pcs-24-oz",
  // Kosher Grass-Fed Boneless Prime Ribeye Roast · 3.5 lb
  "prime-ribeye-roast-boneless-100-grass-fed-all-natural-no-hormones-no-antibiotics-35-lb-uncooked-kosher-for-passover-2699lb",
  // Kosher Grass-Fed Boneless London Broil Signature Cut · 1.75 lb
  "london-broil-signature-cut-boneless-100-grass-fed-all-natural-no-hormones-no-antibiotics-175-lb-uncooked-kosher-for-passover-1899lb",
  // Kosher Classic In-House Roasted Smoked Salmon · 1 lb
  "classic-roasted-smoked-salmon-1-lb-in-house-smoked-and-vacuum-packed-not-kosher-for-passover-2249lb",
  // Kosher Beef Kishke · 16 oz
  "kishke-16-oz-not-pareve-uncooked-not-kosher-for-passover",
] as const

const PRODUCT_TAGS: Record<string, string> = {
  "beef-biltong-slices-regular-south-african-beef-jerky-3-oz-not-kosher-for-passover":
    "South African",
  "kosherboeries-authentic-south-african-beef-grilling-sausages-no-nitrates-classic-6-pcs-24-oz":
    "South African",
  "prime-ribeye-roast-boneless-100-grass-fed-all-natural-no-hormones-no-antibiotics-35-lb-uncooked-kosher-for-passover-2699lb":
    "100% Grass-Fed",
  "london-broil-signature-cut-boneless-100-grass-fed-all-natural-no-hormones-no-antibiotics-175-lb-uncooked-kosher-for-passover-1899lb":
    "100% Grass-Fed",
  "classic-roasted-smoked-salmon-1-lb-in-house-smoked-and-vacuum-packed-not-kosher-for-passover-2249lb":
    "House-Smoked",
  "kishke-16-oz-not-pareve-uncooked-not-kosher-for-passover": "Traditional",
}

export default async function SpecialtyRow({
  countryCode = "us",
}: {
  countryCode?: string
}) {
  const handles = [...SPECIALTY_PRODUCT_HANDLES]
  let strapiProducts: Awaited<ReturnType<typeof getProductsByHandlesStrict>> =
    []
  try {
    strapiProducts = await getProductsByHandlesStrict(handles, strapiClient)
  } catch (error) {
    await emitHomepageProductRailFailureAlert({
      rail: "specialty",
      countryCode,
      handleCount: handles.length,
      error,
    }).catch(() => {
      // Fail open: product rail alerting must not block the homepage.
    })
  }

  const products = await enrichStrapiProductsWithMedusaPrices(
    strapiProducts,
    countryCode
  )
  const compactProducts = compactCollectionProducts(products)
  if (!compactProducts.length) return null

  const tagByHandle = Object.fromEntries(
    Object.entries(PRODUCT_TAGS).flatMap(([handle, tag]) => {
      const safeTag = suppressInvalidProductTag(tag, { handle })
      return safeTag ? [[handle, safeTag]] : []
    })
  )

  return (
    <section
      aria-labelledby="specialty-row-heading"
      className="overflow-hidden border-y border-Charcoal/10 bg-white py-12 scroll-mt-[120px] md:py-16"
    >
      <SpecialtySwiper
        products={compactProducts}
        countryCode={countryCode}
        tagByHandle={tagByHandle}
      />
    </section>
  )
}

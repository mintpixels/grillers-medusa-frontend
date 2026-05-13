import strapiClient from "@lib/strapi"
import { getProductsByHandles } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import SpecialtySwiper from "./swiper"

/**
 * "Specialty cuts you can't get from your supermarket" — homepage row for
 * #98. Manually curated product IDs in Strapi; refresh seasonally. Should
 * eventually move to a Strapi ComponentHomeSpecialty section so editors can
 * rotate without a code deploy.
 *
 * Visually mirrors the Bestsellers row above — same Swiper carousel, same
 * ProductCard markup, same prev/next + see-all top-right pattern. The only
 * delta is a small Charcoal "tag" overlay on each card image (e.g. "South
 * African", "100% Grass-Fed") to surface what makes the cut specialty.
 */
const SPECIALTY_PRODUCT_IDS = [
  10888, // Kosher Beef Biltong Slices, Regular · 3 oz
  11118, // Kosher KosherBoeries Classic Beef Boerewors (6×4 oz)
  11263, // Kosher Grass-Fed Boneless Prime Ribeye Roast · 3.5 lb
  11260, // Kosher Grass-Fed Boneless London Broil Signature Cut · 1.75 lb
  11524, // Kosher Classic In-House Roasted Smoked Salmon · 1 lb
  10723, // Kosher Beef Kishke · 16 oz
] as const

const PRODUCT_TAGS: Record<number, string> = {
  10888: "South African",
  11118: "South African",
  11263: "100% Grass-Fed",
  11260: "100% Grass-Fed",
  11524: "House-Smoked",
  10723: "Made In-House",
}

async function fetchHandlesById(): Promise<Map<number, string>> {
  const endpoint = process.env.STRAPI_ENDPOINT
  const token = process.env.STRAPI_API_TOKEN
  if (!endpoint || !token) return new Map()

  const params = new URLSearchParams()
  params.set("populate[MedusaProduct][fields][0]", "Handle")
  params.set("fields[0]", "id")
  SPECIALTY_PRODUCT_IDS.forEach((id, i) => {
    params.set(`filters[id][$in][${i}]`, String(id))
  })
  params.set("pagination[pageSize]", String(SPECIALTY_PRODUCT_IDS.length))

  try {
    const res = await fetch(`${endpoint}/api/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) {
      console.error("specialty-row: handle lookup failed", res.status)
      return new Map()
    }
    const json = (await res.json()) as {
      data?: Array<{ id: number; MedusaProduct?: { Handle?: string | null } }>
    }
    const map = new Map<number, string>()
    for (const p of json?.data || []) {
      const handle = p?.MedusaProduct?.Handle
      if (p?.id != null && handle) map.set(p.id, handle)
    }
    return map
  } catch (error) {
    console.error("specialty-row: handle lookup error:", error)
    return new Map()
  }
}

export default async function SpecialtyRow({
  countryCode = "us",
}: {
  countryCode?: string
}) {
  const handlesById = await fetchHandlesById()
  if (handlesById.size === 0) return null

  const handles = SPECIALTY_PRODUCT_IDS.map((id) => handlesById.get(id)).filter(
    (h): h is string => !!h
  )

  const strapiProducts = await getProductsByHandles(handles, strapiClient)
  const products = await enrichStrapiProductsWithMedusaPrices(
    strapiProducts,
    countryCode
  )
  if (!products.length) return null

  const tagByHandle: Record<string, string> = {}
  for (const id of SPECIALTY_PRODUCT_IDS) {
    const h = handlesById.get(id)
    const tag = PRODUCT_TAGS[id]
    if (h && tag) tagByHandle[h] = tag
  }

  return (
    <section
      aria-labelledby="specialty-row-heading"
      className="py-10 md:py-20 bg-Scroll overflow-hidden scroll-mt-[120px]"
    >
      <SpecialtySwiper
        products={products}
        countryCode={countryCode}
        tagByHandle={tagByHandle}
      />
    </section>
  )
}

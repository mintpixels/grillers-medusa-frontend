import LocalizedClientLink from "@modules/common/components/localized-client-link"
import strapiClient from "@lib/strapi"
import { getProductsByHandles } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { ProductCard } from "@modules/collections/components/strapi-product-grid"

/**
 * "Specialty cuts you can't get from your supermarket" — homepage row for
 * #98. Manually curated product IDs in Strapi; refresh seasonally. Should
 * eventually move to a Strapi ComponentHomeSpecialty section so editors can
 * rotate without a code deploy.
 *
 * Cards reuse the canonical `ProductCard` from the collection grid so
 * Specialty visually matches Bestsellers — same image carousel, price
 * format, gluten-free / uncooked badges, View Details + Add to Cart. A
 * tag overlay (e.g. "South African") sits on the image to surface what
 * makes the cut specialty.
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

  // Keep curated order (handlesById preserves insertion order of the source
  // array because we populate it from SPECIALTY_PRODUCT_IDS iteration; rely
  // on getProductsByHandles to sort by the input handles array).
  const handles = SPECIALTY_PRODUCT_IDS.map((id) => handlesById.get(id)).filter(
    (h): h is string => !!h
  )

  const strapiProducts = await getProductsByHandles(handles, strapiClient)
  const products = await enrichStrapiProductsWithMedusaPrices(
    strapiProducts,
    countryCode
  )
  if (!products.length) return null

  // Tag lookup by handle so we can attach the right overlay to each card.
  const tagByHandle: Record<string, string> = {}
  for (const id of SPECIALTY_PRODUCT_IDS) {
    const h = handlesById.get(id)
    const tag = PRODUCT_TAGS[id]
    if (h && tag) tagByHandle[h] = tag
  }

  return (
    <section
      aria-labelledby="specialty-row-heading"
      className="bg-Scroll py-10 md:py-20 overflow-hidden"
    >
      <div className="content-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-12">
          <div className="max-w-2xl">
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-RichGold mb-3">
              Specialty · Hard to Find
            </p>
            <h2
              id="specialty-row-heading"
              className="text-h2-mobile md:text-h2 font-gyst text-Charcoal text-balance leading-tight"
            >
              Cuts you can't get from your supermarket.
            </h2>
            <p className="text-p-md font-maison-neue text-Charcoal/70 mt-4 leading-relaxed">
              Biltong, boerewors, grass-fed beef, house-smoked salmon, kishke.
              Twenty-three years of sourcing kosher specialty cuts you only
              find here.
            </p>
          </div>
          <LocalizedClientLink
            href="/page/specialty"
            className="shrink-0 inline-flex items-center gap-2 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Charcoal hover:text-RichGold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded"
          >
            Shop all specialty
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 1l5 5-5 5M15 6H0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </LocalizedClientLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
          {products.map((product) => {
            const handle = product?.MedusaProduct?.Handle || ""
            const tag = tagByHandle[handle]
            return (
              <div key={product.documentId} className="relative">
                {tag && (
                  <span className="absolute top-3 left-3 z-10 inline-block bg-Charcoal text-Scroll text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest px-2.5 py-1 rounded-sm pointer-events-none">
                    {tag}
                  </span>
                )}
                <ProductCard product={product} countryCode={countryCode} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

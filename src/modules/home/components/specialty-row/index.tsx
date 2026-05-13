import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Specialty cuts you can't get from your supermarket" — homepage row for
 * #98. Manually curated product IDs from Strapi; refresh seasonally. Should
 * eventually move to a Strapi ComponentHomeSpecialty section so editors can
 * rotate without a code deploy, but for launch this is the lighter-touch
 * fix.
 */
const SPECIALTY_PRODUCT_IDS = [
  10888, // Kosher Beef Biltong Slices, Regular · 3 oz
  11118, // Kosher KosherBoeries Classic Beef Boerewors (6×4 oz)
  11263, // Kosher Grass-Fed Boneless Prime Ribeye Roast · 3.5 lb
  11260, // Kosher Grass-Fed Boneless London Broil Signature Cut · 1.75 lb
  11524, // Kosher Classic In-House Roasted Smoked Salmon · 1 lb
  10723, // Kosher Beef Kishke · 16 oz
] as const

type SpecialtyProduct = {
  id: number
  Title?: string | null
  FeaturedImage?: { url: string } | null
  MedusaProduct?: { Handle?: string | null; Title?: string | null } | null
}

async function fetchSpecialtyProducts(): Promise<SpecialtyProduct[]> {
  const endpoint = process.env.STRAPI_ENDPOINT
  const token = process.env.STRAPI_API_TOKEN
  if (!endpoint || !token) return []

  // Strapi 5 GraphQL doesn't expose `id` in filter inputs, so use the REST
  // API with `filters[id][$in]`. Pull just the fields the row needs.
  const params = new URLSearchParams()
  params.set("populate[FeaturedImage][fields][0]", "url")
  params.set("populate[MedusaProduct][fields][0]", "Handle")
  params.set("populate[MedusaProduct][fields][1]", "Title")
  params.set("fields[0]", "Title")
  params.set("fields[1]", "id")
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
      console.error("specialty-row: Strapi REST returned", res.status)
      return []
    }
    const json = (await res.json()) as { data?: SpecialtyProduct[] }
    const fetched = json?.data || []
    // Preserve the curated order; Strapi returns by id ASC.
    const byId = new Map<number, SpecialtyProduct>()
    for (const p of fetched) {
      if (p?.id != null) byId.set(p.id, p)
    }
    return SPECIALTY_PRODUCT_IDS.map((id) => byId.get(id)).filter(
      (p): p is SpecialtyProduct => !!p
    )
  } catch (error) {
    console.error("specialty-row: fetch error:", error)
    return []
  }
}

export default async function SpecialtyRow() {
  const products = await fetchSpecialtyProducts()
  if (!products.length) return null

  return (
    <section
      aria-labelledby="specialty-row-heading"
      className="bg-Charcoal text-Scroll py-12 md:py-20"
    >
      <div className="content-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
          <div className="max-w-3xl">
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Gold mb-4">
              Specialty · Hard to Find
            </p>
            <h2
              id="specialty-row-heading"
              className="font-rexton text-h2-mobile md:text-h2 text-Scroll uppercase leading-tight mb-4"
            >
              Cuts you can't get
              <br />
              from your supermarket.
            </h2>
            <p className="text-p-md font-maison-neue text-Scroll/80">
              Biltong &middot; Boerewors &middot; Grass-fed &middot; Smoked
              salmon &middot; Custom-cut. Twenty-three years of sourcing kosher
              specialty cuts you only find here.
            </p>
          </div>
          <LocalizedClientLink
            href="/page/specialty"
            className="self-start md:self-end inline-flex items-center gap-2 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest text-Gold hover:text-Gold/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold rounded"
          >
            Shop all specialty cuts
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

        <ul
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
          role="list"
        >
          {products.map((p) => {
            const handle = p.MedusaProduct?.Handle
            const title =
              p.Title || p.MedusaProduct?.Title || "Specialty cut"
            const image = p.FeaturedImage?.url
            const href = handle ? `/products/${handle}` : "/page/specialty"
            return (
              <li key={p.id}>
                <LocalizedClientLink
                  href={href}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-4 focus-visible:ring-offset-Charcoal rounded-sm"
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-Charcoal/40 border border-white/5">
                    {image ? (
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-Scroll/30 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest">
                        Specialty
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-p-sm font-maison-neue font-semibold text-Scroll line-clamp-2 group-hover:text-Gold transition-colors">
                    {title}
                  </p>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

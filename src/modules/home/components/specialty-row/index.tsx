import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Specialty cuts you can't get from your supermarket" — homepage row for
 * #98. Manually curated product IDs from Strapi; refresh seasonally. Should
 * eventually move to a Strapi ComponentHomeSpecialty section so editors can
 * rotate without a code deploy, but for launch this is the lighter-touch
 * fix.
 *
 * Visual treatment intentionally light + serif to match the Bestsellers /
 * Shop Collections rows above and below — keeping the section lightweight
 * here avoids the dark-on-dark "one big slab" effect when it sits next to
 * the KosherPromise section.
 */
const SPECIALTY_PRODUCT_IDS = [
  10888, // Kosher Beef Biltong Slices, Regular · 3 oz
  11118, // Kosher KosherBoeries Classic Beef Boerewors (6×4 oz)
  11263, // Kosher Grass-Fed Boneless Prime Ribeye Roast · 3.5 lb
  11260, // Kosher Grass-Fed Boneless London Broil Signature Cut · 1.75 lb
  11524, // Kosher Classic In-House Roasted Smoked Salmon · 1 lb
  10723, // Kosher Beef Kishke · 16 oz
] as const

// Small "tag" copy per product so each card surfaces what makes the cut
// specialty. Keyed by Strapi product id so the same product always carries
// the same tag regardless of how the row is shuffled.
const PRODUCT_TAGS: Record<number, string> = {
  10888: "South African",
  11118: "South African",
  11263: "100% Grass-Fed",
  11260: "100% Grass-Fed",
  11524: "House-Smoked",
  10723: "Made In-House",
}

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
      className="bg-Scroll py-14 md:py-24 overflow-hidden"
    >
      <div className="content-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
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

        <ul
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5"
          role="list"
        >
          {products.map((p) => {
            const handle = p.MedusaProduct?.Handle
            const title =
              p.Title || p.MedusaProduct?.Title || "Specialty cut"
            const image = p.FeaturedImage?.url
            const tag = PRODUCT_TAGS[p.id]
            const href = handle ? `/products/${handle}` : "/page/specialty"
            return (
              <li key={p.id}>
                <LocalizedClientLink
                  href={href}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-Gold focus-visible:ring-offset-2 rounded-sm"
                >
                  <article className="bg-white shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
                    <div className="relative w-full aspect-square overflow-hidden bg-Charcoal/5">
                      {image ? (
                        <Image
                          src={image}
                          alt={title}
                          fill
                          sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-Charcoal/30 text-p-sm-mono font-maison-neue-mono uppercase tracking-widest">
                          Specialty
                        </div>
                      )}
                      {tag && (
                        <span className="absolute top-3 left-3 inline-block bg-Charcoal text-Scroll text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest px-2.5 py-1 rounded-sm">
                          {tag}
                        </span>
                      )}
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 className="text-p-sm md:text-p-md font-maison-neue font-semibold text-Charcoal line-clamp-2 leading-snug min-h-[2.6em]">
                        {title}
                      </h3>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-p-ex-sm-mono font-maison-neue-mono uppercase tracking-widest text-RichGold group-hover:text-Gold transition-colors">
                        View details
                        <svg
                          width="12"
                          height="10"
                          viewBox="0 0 16 12"
                          fill="none"
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5"
                        >
                          <path
                            d="M10 1l5 5-5 5M15 6H0"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </p>
                    </div>
                  </article>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

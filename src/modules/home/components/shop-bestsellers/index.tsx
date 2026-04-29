import strapiClient from "@lib/strapi"
import { getProductsByHandles } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import BestsellersSwiper from "./swiper"

// Strapi seeds this section with a curated list — each entry's `Slug` field
// stores the Medusa product handle (#38). At render time we look up the full
// Strapi product by handle so the cards mirror the PDP related-products UI
// (image gallery, badges, live Medusa price, Add-to-Cart, View Details).
type BestsellersData = {
  BestsellersTitle: string
  Products?: Array<{
    id: number
    Slug?: string
    Title?: string
  }>
}

export default async function BestsellersSection({
  data,
  countryCode = "us",
}: {
  data: BestsellersData
  countryCode?: string
}) {
  const handles = (data?.Products || [])
    .map((p) => p?.Slug?.trim())
    .filter((s): s is string => !!s)

  const strapiProducts = await getProductsByHandles(handles, strapiClient)
  const products = await enrichStrapiProductsWithMedusaPrices(
    strapiProducts,
    countryCode
  )

  return (
    <section
      id="bestsellers"
      className="py-10 md:py-20 bg-Scroll overflow-hidden scroll-mt-[120px]"
    >
      <BestsellersSwiper
        title={data?.BestsellersTitle || "Shop Bestsellers"}
        products={products}
        countryCode={countryCode}
      />
    </section>
  )
}

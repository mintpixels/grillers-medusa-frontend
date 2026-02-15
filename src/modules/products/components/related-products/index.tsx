import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { getProductsByMedusaIds } from "@lib/data/strapi/collections"
import strapiClient from "@lib/strapi"
import StrapiProductGrid from "@modules/collections/components/strapi-product-grid"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Fetch related products from Medusa to get IDs
  const queryParams: HttpTypes.StoreProductParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const medusaProducts = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products
      .filter((responseProduct) => responseProduct.id !== product.id)
      .slice(0, 6)
  })

  if (!medusaProducts.length) {
    return null
  }

  // Fetch Strapi data for these products using their Medusa IDs
  const medusaIds = medusaProducts
    .map((p) => p.id)
    .filter(Boolean) as string[]

  const strapiProducts = await getProductsByMedusaIds(medusaIds, strapiClient)

  if (!strapiProducts.length) {
    return null
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-p-sm-mono font-maison-neue-mono uppercase text-gray-600 mb-3 tracking-wider">
          Related products
        </h2>
        <p className="text-h4 font-gyst text-Charcoal max-w-2xl">
          You might also want to check out these products.
        </p>
      </div>

      <StrapiProductGrid
        products={strapiProducts}
        countryCode={countryCode}
        viewMode="grid"
      />
    </div>
  )
}

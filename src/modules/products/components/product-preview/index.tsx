import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
  strapiTitle,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  strapiTitle?: string
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block min-h-[44px]"
    >
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="mt-4 space-y-2">
          <h3 
            className="text-p-md font-maison-neue text-Charcoal group-hover:text-VibrantRed transition-colors line-clamp-2" 
            data-testid="product-title"
          >
            {strapiTitle || product.title}
          </h3>
          {cheapestPrice && (
            <div className="flex items-baseline gap-2">
              {/* PreviewPrice resolves per-lb vs fixed-price by SKU
                  lookup (in the bundled map). Strapi `Metadata.PricingMode`
                  + AvgPackWeight aren't fetched on this Medusa-only path,
                  so the SKU map covers it. */}
              <PreviewPrice
                price={cheapestPrice}
                sku={product.variants?.[0]?.sku}
              />
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}

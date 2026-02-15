import { HttpTypes } from "@medusajs/types"
import { getRandomProductsWithImages } from "@lib/data/strapi/collections"
import strapiClient from "@lib/strapi"
import RelatedProductsSwiper from "./swiper"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  // Randomly pick 8 products from the catalogue that have both
  // a FeaturedImage and at least one GalleryImage, excluding the current product
  const strapiProducts = await getRandomProductsWithImages(
    8,
    product.id,
    strapiClient
  )

  if (!strapiProducts.length) {
    return null
  }

  return (
    <RelatedProductsSwiper
      products={strapiProducts}
      countryCode={countryCode}
    />
  )
}

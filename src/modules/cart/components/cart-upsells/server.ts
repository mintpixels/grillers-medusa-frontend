import strapiClient from "@lib/strapi"
import { getProductsByHandles } from "@lib/data/strapi/collections"
import { enrichStrapiProductsWithMedusaPrices } from "@lib/data/products"
import { isVariantPurchasable } from "@lib/util/product-availability"
import { CART_UPSELL_HANDLES } from "./config"
import type { CartUpsellProduct } from "./types"

export async function getCartUpsellProducts(
  countryCode = "us"
): Promise<CartUpsellProduct[]> {
  const strapiProducts = await getProductsByHandles(
    [...CART_UPSELL_HANDLES],
    strapiClient
  )
  const products = await enrichStrapiProductsWithMedusaPrices(
    strapiProducts,
    countryCode
  )

  const upsells: CartUpsellProduct[] = []

  for (const product of products) {
    const medusaProduct = product.MedusaProduct
    const variant = medusaProduct?.Variants?.[0]
    const image =
      product.FeaturedImage?.url ||
      product.GalleryImages?.find((img) => img?.url)?.url

    if (!medusaProduct?.ProductId || !medusaProduct.Handle || !variant?.VariantId || !image) {
      continue
    }

    upsells.push({
      id: medusaProduct.ProductId,
      title: product.Title,
      handle: medusaProduct.Handle,
      image,
      variantId: variant.VariantId,
      price: variant.Price?.CalculatedPriceNumber,
      canAddToCart: isVariantPurchasable(variant),
    })
  }

  return upsells
}

import React, { Suspense } from "react"

import { notFound } from "next/navigation"

import { HttpTypes } from "@medusajs/types"
import ProductDetail from "@modules/products/components/product-detail"
import HowItWorksSection from "@modules/products/components/how-it-works"
import HowItFitsSection from "@modules/products/components/how-it-fits"
import WhyUsSection from "@modules/products/components/why-us"
import PairsWellWith from "@modules/products/components/pairs-well-with"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import type { PurchaseHistoryItem } from "@lib/data/orders"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiCommonPdpData: any
  strapiProductData: any
  purchaseHistoryItem?: PurchaseHistoryItem | null
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  strapiCommonPdpData,
  strapiProductData,
  purchaseHistoryItem,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <Suspense fallback={null}>
        <ProductDetail
          product={product}
          region={region}
          countryCode={countryCode}
          strapiProductData={strapiProductData}
          purchaseHistoryItem={purchaseHistoryItem}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PairsWellWith product={product} countryCode={countryCode} />
      </Suspense>
      <Suspense fallback={null}>
        <HowItWorksSection data={strapiCommonPdpData?.HowItWorks} />
        <HowItFitsSection recipes={strapiProductData?.Recipes} />
        <WhyUsSection data={strapiCommonPdpData?.WhyUs} />
      </Suspense>
      <div className="content-container my-16">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate

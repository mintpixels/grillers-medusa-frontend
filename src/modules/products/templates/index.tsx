import React, { Suspense } from "react"

import { notFound } from "next/navigation"

import { HttpTypes } from "@medusajs/types"
import ProductDetail from "@modules/products/components/product-detail"
import HowItWorksSection from "@modules/products/components/how-it-works"
import HowItFitsSection from "@modules/products/components/how-it-fits"
import WhyUsSection from "@modules/products/components/why-us"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  strapiCommonPdpData: any
  strapiProductData: any
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  strapiCommonPdpData,
  strapiProductData,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <Suspense fallback={null}>
      <ProductDetail
        product={product}
        region={region}
        countryCode={countryCode}
        strapiProductData={strapiProductData}
      />
      <HowItWorksSection data={strapiCommonPdpData?.HowItWorks} />
      <HowItFitsSection recipes={strapiProductData?.Recipes} />
      <WhyUsSection data={strapiCommonPdpData?.WhyUs} />
    </Suspense>
  )
}

export default ProductTemplate

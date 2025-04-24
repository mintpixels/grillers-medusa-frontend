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
  commonPdpData: any
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  commonPdpData,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  console.log("commonPdpData", commonPdpData)

  return (
    <Suspense fallback={null}>
      <ProductDetail
        product={product}
        region={region}
        countryCode={countryCode}
      />
      <HowItWorksSection data={commonPdpData?.HowItWorks} />
      <HowItFitsSection />
      <WhyUsSection data={commonPdpData?.WhyUs} />
    </Suspense>
  )
}

export default ProductTemplate

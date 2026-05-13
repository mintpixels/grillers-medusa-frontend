import React, { Suspense } from "react"

import { notFound } from "next/navigation"

import { HttpTypes } from "@medusajs/types"
import ProductDetail from "@modules/products/components/product-detail"
import HowItWorksSection from "@modules/products/components/how-it-works"
import HowItFitsSection from "@modules/products/components/how-it-fits"
import WhyUsSection from "@modules/products/components/why-us"
import ShippingEligibility from "@modules/products/components/shipping-eligibility"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"

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
    <>
      <Suspense fallback={null}>
        <ProductDetail
          product={product}
          region={region}
          countryCode={countryCode}
          strapiProductData={strapiProductData}
        />
        {/* Shipping & pickup callout — moved out of the buybox column
            (#128 part 2). Sits between the buybox section and
            HowItWorks as the first "trust building" block below the
            fold. Constrained to a comfortable max-width so the small
            chip-style card doesn't stretch full-page. */}
        <div className="content-container my-10">
          <div className="mx-auto max-w-2xl">
            <ShippingEligibility countryCode={countryCode} />
          </div>
        </div>
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

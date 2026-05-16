import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import strapiClient from "@lib/strapi"
import { GetCommonPdpQuery, GetProductQuery, generateProductJsonLd } from "@lib/data/strapi/pdp"
import { getBaseURL } from "@lib/util/env"
import { withTimeout } from "@lib/util/promise-timeout"
import { retrieveCustomer } from "@lib/data/customer"
import { listPurchaseHistory } from "@lib/data/orders"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

function titleFromHandle(handle: string) {
  return handle
    .replace(/-\d+(?:lb|oz).*$/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const baseUrl = getBaseURL()
  const productUrl = `${baseUrl}/${params.countryCode}/products/${handle}`
  const fallbackTitle = `${titleFromHandle(handle)} | Grillers Pride`
  const fallbackDescription =
    "Shop premium kosher meats from Grillers Pride. Order online for shipping, local delivery, or plant pickup."

  const [region, product] = await Promise.all([
    withTimeout(
      getRegion(params.countryCode),
      1200,
      null,
      `PDP metadata region lookup for ${handle}`
    ),
    withTimeout(
      listProducts({
        countryCode: params.countryCode,
        queryParams: { handle },
      }).then(({ response }) => response.products[0] || null),
      2500,
      null,
      `PDP metadata product lookup for ${handle}`
    ),
  ])

  if (!region || !product) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: { canonical: productUrl },
    }
  }

  // Fetch Strapi product data for SEO
  let strapiProductData: any = null
  try {
    strapiProductData = await withTimeout(
      strapiClient.request(GetProductQuery, {
        medusa_product_id: product.id,
      }),
      1200,
      null,
      `PDP metadata Strapi lookup for ${handle}`
    )
  } catch (error) {
    console.error("Failed to fetch Strapi product SEO data:", error)
  }

  const strapiProduct = strapiProductData?.products?.[0]

  // Use Strapi SEO data if available, otherwise fallback to Medusa
  const seo = strapiProduct?.SEO
  const socialMeta = strapiProduct?.SocialMeta
  
  // Build title - always append " | Grillers Pride" if not already present
  const baseTitle = seo?.metaTitle || strapiProduct?.Title || product.title
  const title = baseTitle.includes("Grillers Pride") 
    ? baseTitle 
    : `${baseTitle} | Grillers Pride`
  
  const description =
    seo?.metaDescription ||
    strapiProduct?.MedusaProduct?.Description ||
    product.description ||
    `Shop ${strapiProduct?.Title || product.title} at Grillers Pride. Premium kosher meats delivered fresh to your door.`
  
  const imageUrl = strapiProduct?.FeaturedImage?.url || product.thumbnail

  return {
    title,
    description,
    alternates: {
      // Always use our env-driven productUrl — Strapi's seo.canonicalUrl is
      // often the legacy grillerspride.com URL imported from the old site,
      // which would tell Google to index the legacy domain instead of ours.
      canonical: productUrl,
    },
    openGraph: {
      title: socialMeta?.ogTitle || title,
      description: socialMeta?.ogDescription || description,
      type: (socialMeta?.ogType as any) || "website",
      url: productUrl,
      siteName: "Grillers Pride",
      images: socialMeta?.ogImage?.url
        ? [
            {
              url: socialMeta.ogImage.url,
              alt: socialMeta.ogImageAlt || strapiProduct?.Title || product.title,
            },
          ]
        : imageUrl
        ? [
            {
              url: imageUrl,
              alt: strapiProduct?.Title || product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: (socialMeta?.twitterCard as any) || "summary_large_image",
      title: socialMeta?.twitterTitle || title,
      description: socialMeta?.twitterDescription || description,
      images: socialMeta?.twitterImage?.url
        ? [socialMeta.twitterImage.url]
        : imageUrl
        ? [imageUrl]
        : [],
      site: socialMeta?.twitterSite,
      creator: socialMeta?.twitterCreator,
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const [region, productResult, strapiCommonPdpData, customer] =
    await Promise.all([
      getRegion(params.countryCode),
      listProducts({
        countryCode: params.countryCode,
        queryParams: { handle: params.handle },
      }),
      withTimeout(
        strapiClient.request(GetCommonPdpQuery).catch((error) => {
          console.error("Failed to fetch common PDP data from Strapi:", error)
          return null
        }),
        1200,
        null,
        `Common PDP data for ${params.handle}`
      ),
      withTimeout(
        retrieveCustomer().catch(() => null),
        1200,
        null,
        `PDP customer lookup for ${params.handle}`
      ),
    ])

  if (!region) {
    notFound()
  }

  const pricedProduct = productResult.response.products[0]

  if (!pricedProduct) {
    notFound()
  }

  let strapiProductData: any = null

  try {
    strapiProductData = await withTimeout(
      strapiClient.request(GetProductQuery, {
        medusa_product_id: pricedProduct.id,
      }),
      2500,
      null,
      `PDP Strapi product data for ${pricedProduct.id}`
    )
  } catch (error) {
    console.error(
      "Failed to fetch product data from Strapi for ID:",
      pricedProduct.id,
      error
    )
  }

  const baseUrl = getBaseURL()
  const productJsonLd = generateProductJsonLd(
    pricedProduct,
    strapiProductData?.products?.[0] || null,
    baseUrl,
    params.countryCode
  )

  const purchaseHistoryItem = customer
    ? (
        await withTimeout(
          listPurchaseHistory().catch(() => []),
          1200,
          [],
          `PDP purchase history for ${pricedProduct.id}`
        )
      ).find((item) => item.productId === pricedProduct.id) || null
    : null

  return (
    <>
      {/* Product JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        strapiCommonPdpData={strapiCommonPdpData?.pdp}
        strapiProductData={strapiProductData?.products?.[0]}
        purchaseHistoryItem={purchaseHistoryItem}
      />
    </>
  )
}

export const dynamic = "force-dynamic"

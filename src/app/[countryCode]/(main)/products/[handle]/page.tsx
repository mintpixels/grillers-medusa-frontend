import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import strapiClient from "@lib/strapi"
import { GetCommonPdpQuery, GetProductQuery, generateProductJsonLd } from "@lib/data/strapi/pdp"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  // Fetch Strapi product data for SEO
  let strapiProductData: any = null
  try {
    strapiProductData = await strapiClient.request(GetProductQuery, {
      medusa_product_id: product.id,
    })
  } catch (error) {
    console.error("Failed to fetch Strapi product SEO data:", error)
  }

  const strapiProduct = strapiProductData?.products?.[0]
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const productUrl = `${baseUrl}/${params.countryCode}/products/${handle}`

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
      canonical: seo?.canonicalUrl || productUrl,
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
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  let strapiCommonPdpData: any = null
  let strapiProductData: any = null

  try {
    strapiCommonPdpData = await strapiClient.request(GetCommonPdpQuery)
  } catch (error) {
    console.error("Failed to fetch common PDP data from Strapi:", error)
  }

  try {
    strapiProductData = await strapiClient.request(GetProductQuery, {
      medusa_product_id: pricedProduct.id,
    })
  } catch (error) {
    console.error(
      "Failed to fetch product data from Strapi for ID:",
      pricedProduct.id,
      error
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const productJsonLd = generateProductJsonLd(
    pricedProduct,
    strapiProductData?.products?.[0] || null,
    baseUrl,
    params.countryCode
  )

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
      />
    </>
  )
}

export const dynamic = "force-dynamic"

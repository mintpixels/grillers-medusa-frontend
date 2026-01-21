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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const productUrl = `${baseUrl}/${params.countryCode}/products/${handle}`

  const title = `${product.title} | Grillers Pride`
  const description =
    product.description ||
    `Shop ${product.title} at Grillers Pride. Premium kosher meats delivered fresh to your door.`

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: productUrl,
      siteName: "Grillers Pride",
      images: product.thumbnail
        ? [
            {
              url: product.thumbnail,
              alt: product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
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

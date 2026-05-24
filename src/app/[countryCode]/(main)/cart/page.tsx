import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import { buildCartProductDetailsMap } from "@lib/util/cart-product-details"
import { withTimeout } from "@lib/util/promise-timeout"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateAlternates } from "@lib/util/seo"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  const alternates = await generateAlternates("/cart", countryCode)

  return {
    title: "Cart | Grillers Pride",
    description: "View and manage your shopping cart",
    alternates,
  }
}

export default async function Cart({ params }: PageProps) {
  const { countryCode } = await params
  const [cart, customer, deliveryZip, atlantaZipConfig] = await Promise.all([
    retrieveCart().catch((error) => {
      console.error(error)
      return undefined
    }),
    withTimeout(
      retrieveCustomer().catch(() => null),
      1000,
      null,
      "cart page customer"
    ),
    withTimeout(getDeliveryZipCookie(), 400, null, "cart page delivery zip"),
    withTimeout(
      getAtlantaDeliveryZipConfig().catch(() => undefined),
      1000,
      undefined,
      "cart page delivery config"
    ),
  ])

  if (cart === undefined) {
    return notFound()
  }

  const productDetailsMap = await withTimeout(
    buildCartProductDetailsMap(cart?.items),
    1000,
    {},
    "cart page product details"
  )

  const defaultDeliveryZip =
    deliveryZip || getAddressBookDeliveryZip(customer?.addresses)

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      countryCode={countryCode}
      deliveryZip={defaultDeliveryZip}
      atlantaZipConfig={atlantaZipConfig}
      productDetailsMap={productDetailsMap}
    />
  )
}

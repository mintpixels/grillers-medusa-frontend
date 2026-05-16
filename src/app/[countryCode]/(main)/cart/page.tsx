import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateAlternates } from "@lib/util/seo"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  const alternates = await generateAlternates("/cart", countryCode)
  
  return {
    title: "Cart | Grillers Pride",
    description: "View and manage your shopping cart",
    alternates,
  }
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const [customer, deliveryZip, atlantaZipConfig] = await Promise.all([
    retrieveCustomer(),
    getDeliveryZipCookie(),
    getAtlantaDeliveryZipConfig().catch(() => undefined),
  ])
  const defaultDeliveryZip =
    deliveryZip || getAddressBookDeliveryZip(customer?.addresses)

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      deliveryZip={defaultDeliveryZip}
      atlantaZipConfig={atlantaZipConfig}
    />
  )
}

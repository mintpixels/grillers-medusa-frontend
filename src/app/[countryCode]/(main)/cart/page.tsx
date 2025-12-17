import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateAlternates } from "@lib/util/seo"

type PageProps = {
  params: { countryCode: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const alternates = await generateAlternates("/cart", params.countryCode)
  
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

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}

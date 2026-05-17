import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import { Toaster } from "@medusajs/ui"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { CartProvider } from "@modules/layout/components/side-cart/cart-context"
import SideCartWrapper from "@modules/layout/components/side-cart/side-cart-wrapper"
import { withTimeout } from "@lib/util/promise-timeout"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const [customer, cart] = await Promise.all([
    withTimeout(
      retrieveCustomer().catch(() => null),
      1000,
      null,
      "main layout customer"
    ),
    withTimeout(
      retrieveCart().catch(() => null),
      1000,
      null,
      "main layout cart"
    ),
  ])
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await withTimeout(
      listCartOptions().catch(() => ({ shipping_options: [] })),
      800,
      { shipping_options: [] },
      "main layout shipping options"
    )

    shippingOptions = shipping_options
  }

  return (
    <CartProvider>
      <Nav customer={customer} />
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer />
      <SideCartWrapper />
      <Toaster position="bottom-center" />
    </CartProvider>
  )
}

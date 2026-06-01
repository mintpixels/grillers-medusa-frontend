import { Suspense } from "react"
import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { Toaster } from "@medusajs/ui"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { CartProvider } from "@modules/layout/components/side-cart/cart-context"
import SideCartWrapper from "@modules/layout/components/side-cart/side-cart-wrapper"
import StorefrontFreeShippingNudge from "@modules/layout/components/free-shipping-nudge"
import { StorefrontSessionProvider } from "@modules/layout/components/storefront-session"
import StaffContextBanner from "@modules/staff/components/staff-context-banner"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <CartProvider>
      <StorefrontSessionProvider>
        <Nav />
        <StaffContextBanner />
        <StorefrontFreeShippingNudge />
        {props.children}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <SideCartWrapper countryCode={countryCode} />
        <Toaster position="bottom-center" />
      </StorefrontSessionProvider>
    </CartProvider>
  )
}

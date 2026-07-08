import { Suspense } from "react"
import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { retrieveCustomer } from "@lib/data/customer"
import NewsletterPopup from "@components/newsletter-popup"
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
  // Popup is guest-only: signed-in customers manage email in their account.
  const customer = await retrieveCustomer().catch(() => null)

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
        {!customer ? <NewsletterPopup /> : null}
        <Toaster position="bottom-center" />
      </StorefrontSessionProvider>
    </CartProvider>
  )
}

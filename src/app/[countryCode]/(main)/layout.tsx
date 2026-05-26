import { Suspense } from "react"
import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import { getBaseURL } from "@lib/util/env"
import type { HttpTypes } from "@medusajs/types"
import { Toaster } from "@medusajs/ui"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { CartProvider } from "@modules/layout/components/side-cart/cart-context"
import SideCartWrapper from "@modules/layout/components/side-cart/side-cart-wrapper"
import { withTimeout } from "@lib/util/promise-timeout"
import StaffContextActions from "@modules/staff/components/staff-context-actions"
import ExperimentExposure from "@lib/experiments/exposure"
import { getExperimentAssignment } from "@lib/experiments/server"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export const dynamic = "force-dynamic"

async function FreeShippingNudgeBlock({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
}) {
  if (!cart) return null

  const { shipping_options } = await withTimeout(
    listCartOptions().catch(() => ({ shipping_options: [] })),
    800,
    { shipping_options: [] },
    "main layout shipping options"
  )

  return (
    <FreeShippingPriceNudge
      variant="popup"
      cart={cart}
      shippingOptions={shipping_options}
    />
  )
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customerPromise = withTimeout(
    retrieveCustomer().catch(() => null),
    1000,
    null,
    "main layout customer"
  )
  const cartPromise = withTimeout(
    retrieveCart().catch(() => null),
    1000,
    null,
    "main layout cart"
  )
  const staffImpersonationPromise = withTimeout(
    getStaffImpersonationSession().catch(() => null),
    800,
    null,
    "main layout staff impersonation"
  )
  const [customer, cart, staffImpersonation] = await Promise.all([
    customerPromise,
    cartPromise,
    staffImpersonationPromise,
  ])
  const navigationExperiment = await getExperimentAssignment(
    "navigation_ways_to_shop_v1",
    {
      routeMarket: countryCode,
      customerType: staffImpersonation
        ? "staff"
        : customer
        ? "registered"
        : "guest",
      userId: customer?.id,
    }
  )

  return (
    <CartProvider>
      <ExperimentExposure assignment={navigationExperiment} />
      <Nav customer={customer} cart={cart} />
      {staffImpersonation && (
        <div className="border-b border-Gold/30 bg-Gold/10 px-4 py-2 text-xs font-maison-neue text-Charcoal">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 small:flex-row small:items-center small:justify-between">
            <p className="text-center small:text-left">
              <span className="font-semibold">
                Staff context active: acting as {staffImpersonation.targetName}.
              </span>{" "}
              Actions are audited to {staffImpersonation.staffName}.
            </p>
            <StaffContextActions />
          </div>
        </div>
      )}
      <Suspense fallback={null}>
        <FreeShippingNudgeBlock cart={cart} />
      </Suspense>
      {props.children}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <SideCartWrapper
          countryCode={countryCode}
          cart={cart}
          customer={customer}
        />
      </Suspense>
      <Toaster position="bottom-center" />
    </CartProvider>
  )
}

import { NextResponse } from "next/server"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getStaffImpersonationSession } from "@lib/data/staff/impersonation"
import {
  getAddressBookDeliveryZip,
  normalizeDeliveryZip,
} from "@lib/util/delivery-zip"
import { isStaffCustomer } from "@lib/util/staff-access"
import { withStorefrontApiFallback } from "@lib/storefront-api-ops-alerts"
import type { StorefrontSessionSnapshot } from "@modules/layout/components/storefront-session/types"

const sessionHeaders = {
  "Cache-Control": "private, max-age=0, must-revalidate",
  Vary: "Cookie",
}

const STOREFRONT_SESSION_PATH = "src/app/api/storefront/session/route.ts"

function customerInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.[0]?.toUpperCase() || ""
  const last = lastName?.[0]?.toUpperCase() || ""
  const initials = `${first}${last}`.trim()

  return initials || null
}

export async function GET() {
  const [customer, cart, staffImpersonation, savedZip] = await Promise.all([
    withStorefrontApiFallback({
      promise: retrieveCustomer(),
      fallback: null,
      route: "session",
      stage: "customer",
      path: STOREFRONT_SESSION_PATH,
      timeoutMs: 1000,
    }),
    withStorefrontApiFallback({
      promise: retrieveCart(undefined, { fresh: true }),
      fallback: null,
      route: "session",
      stage: "cart",
      path: STOREFRONT_SESSION_PATH,
      timeoutMs: 1000,
    }),
    withStorefrontApiFallback({
      promise: getStaffImpersonationSession(),
      fallback: null,
      route: "session",
      stage: "staff_impersonation",
      path: STOREFRONT_SESSION_PATH,
      timeoutMs: 800,
    }),
    getDeliveryZipCookie().catch(() => ""),
  ])

  const shippingOptions = cart
    ? await withStorefrontApiFallback({
        promise: listCartOptions({ fresh: true }).then(
          (result) => result.shipping_options || []
        ),
        fallback: [],
        route: "session",
        stage: "shipping_options",
        path: STOREFRONT_SESSION_PATH,
        timeoutMs: 900,
      })
    : []

  const defaultShipping =
    customer?.addresses?.find((address) => address.is_default_shipping) ||
    customer?.addresses?.[0]
  const addressZip = getAddressBookDeliveryZip(customer?.addresses)
  const cartZip = normalizeDeliveryZip(cart?.shipping_address?.postal_code)
  const normalizedSavedZip = normalizeDeliveryZip(savedZip)
  const deliveryZip = cartZip || addressZip || normalizedSavedZip || null
  const deliveryZipSource = cartZip
    ? "cart"
    : addressZip
    ? "address"
    : normalizedSavedZip
    ? "saved"
    : null

  const snapshot: StorefrontSessionSnapshot = {
    customer: customer
      ? {
          id: customer.id,
          firstName: customer.first_name || null,
          initials: customerInitials(customer.first_name, customer.last_name),
          canUseStaffTools: isStaffCustomer(customer),
          defaultShippingProvince:
            defaultShipping?.province?.toUpperCase() || null,
        }
      : null,
    staffImpersonation: staffImpersonation
      ? {
          staffName: staffImpersonation.staffName,
          targetName: staffImpersonation.targetName,
        }
      : null,
    cart,
    cartItemCount:
      cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0,
    shippingOptions,
    deliveryZip,
    deliveryZipSource,
  }

  return NextResponse.json(snapshot, { headers: sessionHeaders })
}

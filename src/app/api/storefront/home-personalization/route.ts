import { NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import {
  getLatestOrderDeliveryZip,
  listPurchaseHistory,
} from "@lib/data/orders"
import { getReorderStrapiMap } from "@lib/data/home-personalization"
import {
  getAddressBookDeliveryZip,
  normalizeDeliveryZip,
} from "@lib/util/delivery-zip"
import { withTimeout } from "@lib/util/promise-timeout"

const homePersonalizationHeaders = {
  "Cache-Control": "private, max-age=15, must-revalidate",
  Vary: "Cookie",
}

export async function GET() {
  const [customer, cart] = await Promise.all([
    withTimeout(
      retrieveCustomer().catch(() => null),
      1000,
      null,
      "home personalization customer"
    ),
    withTimeout(
      retrieveCart(undefined, { fresh: true }).catch(() => null),
      1000,
      null,
      "home personalization cart"
    ),
  ])

  const isLoggedIn = Boolean(customer)
  const cartZip = normalizeDeliveryZip(cart?.shipping_address?.postal_code)
  const addressBookZip = getAddressBookDeliveryZip(customer?.addresses)
  const latestOrderZip =
    isLoggedIn && !cartZip && !addressBookZip
      ? await withTimeout(
          getLatestOrderDeliveryZip().catch(() => ""),
          1000,
          "",
          "home personalization latest order delivery zip"
        )
      : ""
  const customerZip = cartZip || addressBookZip || latestOrderZip || null
  const customerZipSource = cartZip
    ? "cart"
    : addressBookZip
    ? "address"
    : latestOrderZip
    ? "recent_order"
    : null

  const purchaseHistory = isLoggedIn
    ? await withTimeout(
        listPurchaseHistory().catch(() => []),
        1200,
        [],
        "home personalization purchase history"
      )
    : []
  const strapiMap = await getReorderStrapiMap(purchaseHistory)

  return NextResponse.json(
    {
      isLoggedIn,
      firstName: customer?.first_name || null,
      hasOrders: purchaseHistory.length > 0,
      purchaseHistory,
      strapiMap,
      customerZip,
      customerZipSource,
    },
    { headers: homePersonalizationHeaders }
  )
}

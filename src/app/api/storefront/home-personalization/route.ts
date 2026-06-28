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
import { withStorefrontApiFallback } from "@lib/storefront-api-ops-alerts"

const homePersonalizationHeaders = {
  "Cache-Control": "private, max-age=15, must-revalidate",
  Vary: "Cookie",
}

const HOME_PERSONALIZATION_PATH =
  "src/app/api/storefront/home-personalization/route.ts"

export async function GET() {
  const [customer, cart] = await Promise.all([
    withStorefrontApiFallback({
      promise: retrieveCustomer(),
      fallback: null,
      route: "home_personalization",
      stage: "customer",
      path: HOME_PERSONALIZATION_PATH,
      timeoutMs: 1000,
    }),
    withStorefrontApiFallback({
      promise: retrieveCart(undefined, { fresh: true }),
      fallback: null,
      route: "home_personalization",
      stage: "cart",
      path: HOME_PERSONALIZATION_PATH,
      timeoutMs: 1000,
    }),
  ])

  const isLoggedIn = Boolean(customer)
  const cartZip = normalizeDeliveryZip(cart?.shipping_address?.postal_code)
  const addressBookZip = getAddressBookDeliveryZip(customer?.addresses)
  const latestOrderZip =
    isLoggedIn && !cartZip && !addressBookZip
      ? await withStorefrontApiFallback({
          promise: getLatestOrderDeliveryZip(),
          fallback: "",
          route: "home_personalization",
          stage: "latest_order_delivery_zip",
          path: HOME_PERSONALIZATION_PATH,
          timeoutMs: 1000,
        })
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
    ? await withStorefrontApiFallback({
        promise: listPurchaseHistory(),
        fallback: [],
        route: "home_personalization",
        stage: "purchase_history",
        path: HOME_PERSONALIZATION_PATH,
        timeoutMs: 1200,
      })
    : []
  const strapiMap = await withStorefrontApiFallback({
    promise: getReorderStrapiMap(purchaseHistory),
    fallback: {},
    route: "home_personalization",
    stage: "reorder_strapi_map",
    path: HOME_PERSONALIZATION_PATH,
    timeoutMs: 1800,
  })

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

import { NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getFreeShippingThresholds } from "@lib/data/strapi/checkout"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import { buildCartProductDetailsMap } from "@lib/util/cart-product-details"
import { getCartUpsellProducts } from "@modules/cart/components/cart-upsells/server"
import { withStorefrontApiFallback } from "@lib/storefront-api-ops-alerts"

const sideCartHeaders = {
  "Cache-Control": "private, max-age=0, must-revalidate",
  Vary: "Cookie",
}

const SIDE_CART_PATH = "src/app/api/storefront/side-cart/route.ts"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const countryCode = url.searchParams.get("countryCode") || "us"

  const [cart, atlantaZipConfig, savedZip, customer, freeShippingThresholds] =
    await Promise.all([
      withStorefrontApiFallback({
        promise: retrieveCart(undefined, { fresh: true }),
        fallback: null,
        route: "side_cart",
        stage: "cart",
        path: SIDE_CART_PATH,
        timeoutMs: 1000,
      }),
      withStorefrontApiFallback({
        promise: getAtlantaDeliveryZipConfig(),
        fallback: undefined,
        route: "side_cart",
        stage: "delivery_config",
        path: SIDE_CART_PATH,
        timeoutMs: 900,
      }),
      getDeliveryZipCookie().catch(() => ""),
      withStorefrontApiFallback({
        promise: retrieveCustomer(),
        fallback: null,
        route: "side_cart",
        stage: "customer",
        path: SIDE_CART_PATH,
        timeoutMs: 900,
      }),
      // #266: editable UPS free-shipping thresholds. Safe-fails to nulls →
      // FulfillmentProgress falls back to the hardcoded constants.
      withStorefrontApiFallback({
        promise: getFreeShippingThresholds(),
        fallback: { inRegionThreshold: null, nationalThreshold: null },
        route: "side_cart",
        stage: "free_shipping_thresholds",
        path: SIDE_CART_PATH,
        timeoutMs: 900,
      }),
    ])

  const [upsellProducts, productDetailsMap] = cart?.items?.length
    ? await Promise.all([
        withStorefrontApiFallback({
          promise: getCartUpsellProducts(countryCode),
          fallback: [],
          route: "side_cart",
          stage: "upsells",
          path: SIDE_CART_PATH,
          timeoutMs: 900,
        }),
        withStorefrontApiFallback({
          promise: buildCartProductDetailsMap(cart.items),
          fallback: {},
          route: "side_cart",
          stage: "product_details",
          path: SIDE_CART_PATH,
          timeoutMs: 1000,
        }),
      ])
    : [[], {}]

  const initialDeliveryZip =
    cart?.shipping_address?.postal_code ||
    savedZip ||
    getAddressBookDeliveryZip(customer?.addresses)

  return NextResponse.json(
    {
      cart,
      upsellProducts,
      countryCode,
      atlantaZipConfig,
      initialDeliveryZip,
      productDetailsMap,
      inRegionThreshold: freeShippingThresholds.inRegionThreshold,
      nationalThreshold: freeShippingThresholds.nationalThreshold,
    },
    { headers: sideCartHeaders }
  )
}

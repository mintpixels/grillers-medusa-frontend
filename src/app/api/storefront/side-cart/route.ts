import { NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getDeliveryZipCookie } from "@lib/data/delivery-zip"
import { getAtlantaDeliveryZipConfig } from "@lib/data/strapi/fulfillment"
import { getFreeShippingThresholds } from "@lib/data/strapi/checkout"
import { getAddressBookDeliveryZip } from "@lib/util/delivery-zip"
import { buildCartProductDetailsMap } from "@lib/util/cart-product-details"
import { getCartUpsellProducts } from "@modules/cart/components/cart-upsells/server"
import { withTimeout } from "@lib/util/promise-timeout"

const sideCartHeaders = {
  "Cache-Control": "private, max-age=0, must-revalidate",
  Vary: "Cookie",
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const countryCode = url.searchParams.get("countryCode") || "us"

  const [cart, atlantaZipConfig, savedZip, customer, freeShippingThresholds] =
    await Promise.all([
      withTimeout(
        retrieveCart(undefined, { fresh: true }).catch(() => null),
        1000,
        null,
        "side cart api cart"
      ),
      withTimeout(
        getAtlantaDeliveryZipConfig().catch(() => undefined),
        900,
        undefined,
        "side cart api delivery config"
      ),
      getDeliveryZipCookie().catch(() => ""),
      withTimeout(
        retrieveCustomer().catch(() => null),
        900,
        null,
        "side cart api customer"
      ),
      // #266: editable UPS free-shipping thresholds. Safe-fails to nulls →
      // FulfillmentProgress falls back to the hardcoded constants.
      withTimeout(
        getFreeShippingThresholds().catch(() => ({
          inRegionThreshold: null,
          nationalThreshold: null,
        })),
        900,
        { inRegionThreshold: null, nationalThreshold: null },
        "side cart api free-shipping thresholds"
      ),
    ])

  const [upsellProducts, productDetailsMap] = cart?.items?.length
    ? await Promise.all([
        withTimeout(
          getCartUpsellProducts(countryCode).catch(() => []),
          900,
          [],
          "side cart api upsells"
        ),
        withTimeout(
          buildCartProductDetailsMap(cart.items),
          1000,
          {},
          "side cart api product details"
        ),
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

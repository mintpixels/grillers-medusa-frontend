import {
  buildCheckoutFulfillmentInvariantAlerts,
  emitCheckoutFulfillmentInvariantAlerts,
} from "@lib/checkout-fulfillment-invariants"
import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import type { FulfillmentType } from "@lib/data/cart"
import type { HttpTypes } from "@medusajs/types"

jest.mock("@lib/ops-alert", () => ({
  emitStorefrontOpsAlert: jest.fn(async () => ({ ok: true, skipped: false })),
}))

const emitStorefrontOpsAlertMock =
  emitStorefrontOpsAlert as jest.MockedFunction<typeof emitStorefrontOpsAlert>

function cart(
  overrides: Partial<HttpTypes.StoreCart> & {
    fulfillmentType?: FulfillmentType | string | null
    zip?: string | null
    serviceCode?: string | null
  }
): HttpTypes.StoreCart {
  return {
    id: overrides.id || "cart_123",
    metadata: {
      ...(overrides.metadata || {}),
      ...(overrides.fulfillmentType
        ? { fulfillmentType: overrides.fulfillmentType }
        : {}),
    },
    shipping_address:
      overrides.shipping_address === undefined
        ? ({
            postal_code: overrides.zip || "",
          } as HttpTypes.StoreCartAddress)
        : overrides.shipping_address,
    shipping_methods:
      overrides.shipping_methods === undefined
        ? overrides.serviceCode
          ? ([
              {
                id: "ship_123",
                data: { service_code: overrides.serviceCode },
              },
            ] as any)
          : []
        : overrides.shipping_methods,
  } as HttpTypes.StoreCart
}

describe("checkout fulfillment invariant alerts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("plans a region mismatch alert when UPS remains selected for an Atlanta ZIP", () => {
    const plans = buildCheckoutFulfillmentInvariantAlerts({
      cart: cart({
        fulfillmentType: "ups_shipping",
        zip: "30328",
        serviceCode: "GROUND",
      }),
      atlantaZipCodes: ["30328"],
    })

    expect(plans).toEqual([
      expect.objectContaining({
        alertKind: "checkout_fulfillment_region_mismatch",
        severity: "warn",
        fingerprint: "checkout:fulfillment:region_mismatch:ups_shipping",
        meta: expect.objectContaining({
          checkout_surface: "checkout_form",
          cart_id: "cart_123",
          fulfillment_type: "ups_shipping",
          ship_zip: "30328",
          shipping_method_count: 1,
          selected_shipping_service_codes: ["GROUND"],
          invariant: "fulfillment_type_region_mismatch",
        }),
      }),
    ])
  })

  it("plans a missing shipping method alert for non-UPS fulfillment", () => {
    const plans = buildCheckoutFulfillmentInvariantAlerts({
      cart: cart({
        fulfillmentType: "atlanta_delivery",
        zip: "30328",
      }),
      atlantaZipCodes: ["30328"],
    })

    expect(plans).toEqual([
      expect.objectContaining({
        alertKind: "checkout_fulfillment_shipping_method_missing",
        severity: "warn",
        fingerprint:
          "checkout:fulfillment:shipping_method_missing:atlanta_delivery",
        meta: expect.objectContaining({
          fulfillment_type: "atlanta_delivery",
          invariant: "non_ups_fulfillment_missing_shipping_method",
          expected_service_codes: ["ATLANTA_DELIVERY"],
        }),
      }),
    ])
  })

  it("plans a shipping method mismatch alert when metadata and service code disagree", () => {
    const plans = buildCheckoutFulfillmentInvariantAlerts({
      cart: cart({
        fulfillmentType: "plant_pickup",
        zip: "30328",
        serviceCode: "ATLANTA_DELIVERY",
      }),
      atlantaZipCodes: ["30328"],
    })

    expect(plans).toEqual([
      expect.objectContaining({
        alertKind: "checkout_fulfillment_shipping_method_mismatch",
        severity: "warn",
        fingerprint:
          "checkout:fulfillment:shipping_method_mismatch:plant_pickup:atlanta_delivery",
        meta: expect.objectContaining({
          fulfillment_type: "plant_pickup",
          invariant: "shipping_method_type_mismatch",
          mismatched_service_code: "ATLANTA_DELIVERY",
          service_code_fulfillment_type: "atlanta_delivery",
          expected_service_codes: ["PICKUP"],
        }),
      }),
    ])
  })

  it("does not alert for valid Atlanta delivery with its attached method", () => {
    expect(
      buildCheckoutFulfillmentInvariantAlerts({
        cart: cart({
          fulfillmentType: "atlanta_delivery",
          zip: "30328",
          serviceCode: "ATLANTA_DELIVERY",
        }),
        atlantaZipCodes: ["30328"],
      })
    ).toEqual([])
  })

  it("emits planned checkout fulfillment invariant alerts", async () => {
    await emitCheckoutFulfillmentInvariantAlerts({
      cart: cart({
        fulfillmentType: "ups_shipping",
        zip: "30328",
        serviceCode: "GROUND",
      }),
      atlantaZipCodes: ["30328"],
      path: "test/path.tsx",
    })

    expect(emitStorefrontOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alertKind: "checkout_fulfillment_region_mismatch",
        severity: "warn",
        path: "test/path.tsx",
        fingerprint: "checkout:fulfillment:region_mismatch:ups_shipping",
      })
    )
  })
})

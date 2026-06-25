import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AddBundleButton from "@modules/products/components/pairs-well-with/add-bundle-button"

jest.mock("@medusajs/ui", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("@lib/data/cart", () => ({
  addMultipleToCart: jest.fn(),
}))

jest.mock("@lib/experiments/client-context", () => ({
  experimentCartMetadata: jest.fn(() => ({ experiment_id: "gp-control" })),
}))

jest.mock("@lib/jitsu", () => ({
  jitsuTrack: jest.fn(),
}))

jest.mock("@lib/util/cart-events", () => ({
  dispatchCartUpdated: jest.fn(),
}))

jest.mock("@lib/client-error-reporter", () => ({
  reportClientOpsAlert: jest.fn(),
}))

import { toast } from "@medusajs/ui"
import { addMultipleToCart } from "@lib/data/cart"
import { jitsuTrack } from "@lib/jitsu"
import { dispatchCartUpdated } from "@lib/util/cart-events"
import { reportClientOpsAlert } from "@lib/client-error-reporter"

const mockAddMultipleToCart = addMultipleToCart as jest.MockedFunction<
  typeof addMultipleToCart
>
const mockToast = toast as jest.Mocked<typeof toast>
const mockJitsuTrack = jitsuTrack as jest.MockedFunction<typeof jitsuTrack>
const mockDispatchCartUpdated = dispatchCartUpdated as jest.MockedFunction<
  typeof dispatchCartUpdated
>
const mockReportClientOpsAlert = reportClientOpsAlert as jest.MockedFunction<
  typeof reportClientOpsAlert
>

describe("AddBundleButton", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("adds collection items with one batched cart action", async () => {
    mockAddMultipleToCart.mockResolvedValue({
      added: 2,
      failed: 0,
      addedQuantity: 14,
    })

    render(
      <AddBundleButton
        countryCode="us"
        bundleId="bundle_123"
        bundleSlug="deli-sampler"
        bundleTitle="Deli Sampler"
        items={[
          {
            variantId: "variant_1",
            title: "Kosher Salami",
            quantity: 1,
            metadata: { source_product_id: "prod_1" },
          },
          {
            variantId: "variant_2",
            title: "Kosher Hot Dogs",
            quantity: 13,
            metadata: { source_product_id: "prod_2" },
          },
        ]}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: /add 14 items/i }))

    await waitFor(() => {
      expect(mockAddMultipleToCart).toHaveBeenCalledTimes(1)
    })

    expect(mockAddMultipleToCart).toHaveBeenCalledWith([
      expect.objectContaining({
        variantId: "variant_1",
        quantity: 1,
        countryCode: "us",
        metadata: expect.objectContaining({
          experiment_id: "gp-control",
          source_product_id: "prod_1",
          bundle_id: "bundle_123",
          bundle_title: "Deli Sampler",
          curated_collection_id: "bundle_123",
          curated_collection_title: "Deli Sampler",
          curated_collection_slug: "deli-sampler",
          bundle_quantity: 1,
        }),
      }),
      expect.objectContaining({
        variantId: "variant_2",
        quantity: 13,
        countryCode: "us",
        metadata: expect.objectContaining({
          experiment_id: "gp-control",
          source_product_id: "prod_2",
          bundle_quantity: 13,
        }),
      }),
    ])
    expect(mockDispatchCartUpdated).toHaveBeenCalledWith({
      action: "bundle-add",
      quantity: 14,
    })
    expect(mockToast.success).toHaveBeenCalledWith("Collection added", {
      description: "14 items added to cart.",
    })
    expect(mockJitsuTrack).toHaveBeenCalledWith(
      "add_collection_to_cart",
      expect.objectContaining({
        collection_id: "bundle_123",
        item_count: 14,
        item_count_added: 14,
        line_count: 2,
        sku_count_added: 2,
        sku_count_failed: 0,
      })
    )
  })

  it("emits a revenue-path alert when a collection add is slow", async () => {
    let now = 1_000
    jest.spyOn(Date, "now").mockImplementation(() => now)
    mockAddMultipleToCart.mockImplementation(async () => {
      now = 7_200
      return {
        added: 1,
        failed: 0,
        addedQuantity: 13,
      }
    })

    render(
      <AddBundleButton
        countryCode="us"
        bundleId="bundle_slow"
        bundleSlug="large-sampler"
        bundleTitle="Large Sampler"
        items={[
          {
            variantId: "variant_1",
            title: "Kosher Hot Dogs",
            quantity: 13,
          },
        ]}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: /add 13 items/i }))

    await waitFor(() => {
      expect(mockReportClientOpsAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "revenue_action_slow",
          severity: "warn",
          title: "Collection add took 6200ms",
          extra: expect.objectContaining({
            action: "add_collection_to_cart",
            collection_id: "bundle_slow",
            collection_slug: "large-sampler",
            sku_count: 1,
            quantity_requested: 13,
            quantity_added: 13,
            duration_ms: 6200,
          }),
        })
      )
    })
  })
})

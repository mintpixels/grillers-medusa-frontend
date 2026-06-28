import { render, screen } from "@testing-library/react"

import CheckoutBackToCartLink from "@modules/checkout/components/checkout-back-to-cart-link"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"

const mockUseParams = jest.fn()
const mockFulfillmentProgress = jest.fn()

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}))

jest.mock("@modules/common/components/fulfillment-progress", () => {
  return function MockFulfillmentProgress(props: any) {
    mockFulfillmentProgress(props)
    return <div data-testid="fulfillment-progress">{props.postalCode}</div>
  }
})

jest.mock("@modules/checkout/components/discount-code", () => {
  return function MockDiscountCode() {
    return <div data-testid="discount-code" />
  }
})

jest.mock("@modules/products/components/thumbnail", () => {
  return function MockThumbnail() {
    return <div data-testid="thumbnail" />
  }
})

jest.mock("@lib/hooks/use-product-featured-image", () => ({
  useProductFeaturedImageSrc: (_productId: string, fallback: string) =>
    fallback,
}))

jest.mock("@lib/hooks/use-product-title", () => ({
  useProductTitle: (_productId: string, fallback: string) => fallback,
}))

const baseCart = {
  id: "cart_test",
  items: [],
  promotions: [],
  currency_code: "usd",
  metadata: {},
  subtotal: 100,
  shipping_subtotal: 15,
  shipping_total: 15,
  tax_total: 0,
  discount_total: 0,
  total: 115,
  shipping_address: { province: "GA" },
}

describe("checkout customer-context navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ countryCode: "us" })
  })

  it("uses a hard cart link so customer context is re-read from cookies", () => {
    render(<CheckoutBackToCartLink />)

    expect(screen.getByTestId("back-link")).toHaveAttribute("href", "/us/cart")
  })

  it("uses the customer address zip in the summary when the cart has no shipping zip yet", () => {
    render(<CheckoutSummary cart={baseCart as any} deliveryZip="30329" />)

    expect(mockFulfillmentProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        postalCode: "30329",
      })
    )
  })

  it("prefers the cart shipping zip after checkout writes it", () => {
    render(
      <CheckoutSummary
        cart={
          {
            ...baseCart,
            shipping_address: { province: "CA", postal_code: "90210" },
          } as any
        }
        deliveryZip="30329"
      />
    )

    expect(mockFulfillmentProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        postalCode: "90210",
      })
    )
  })

  it("repairs historically scrambled cart address fields before rendering summary delivery context", () => {
    render(
      <CheckoutSummary
        cart={
          {
            ...baseCart,
            shipping_address: {
              address_1: "220 Glen Meadow Ct",
              city: "GA",
              province: "30328",
              postal_code: "Sandy Springs",
            },
          } as any
        }
        deliveryZip="90210"
      />
    )

    expect(mockFulfillmentProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        shipState: "GA",
        postalCode: "30328",
      })
    )
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import PaymentButton from "@modules/checkout/components/payment-button"
import {
  submitOrderWithSavedPaymentMethod,
  verifyCartInventoryForCheckout,
} from "@lib/data/cart"

jest.mock("@lib/data/cart", () => ({
  submitOrderWithSavedPaymentMethod: jest.fn(),
  verifyCartInventoryForCheckout: jest.fn(),
}))

jest.mock("@lib/jitsu", () => ({
  jitsuTrack: jest.fn(),
}))

const mockPlaceOrder = submitOrderWithSavedPaymentMethod as jest.MockedFunction<
  typeof submitOrderWithSavedPaymentMethod
>
const mockVerifyInventory =
  verifyCartInventoryForCheckout as jest.MockedFunction<
    typeof verifyCartInventoryForCheckout
  >

describe("PaymentButton", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyInventory.mockResolvedValue(undefined as never)
    mockPlaceOrder.mockResolvedValue(undefined as never)
  })

  it("places a catch-weight order with a saved card without requiring Stripe Elements", async () => {
    const user = userEvent.setup()
    const cart = {
      id: "cart_test",
      email: "customer@example.com",
      shipping_address: { address_1: "220 Glen Meadow Ct" },
      billing_address: { address_1: "220 Glen Meadow Ct" },
      shipping_methods: [{ id: "ship_pickup" }],
    } as any

    render(
      <PaymentButton
        cart={cart}
        savedPaymentMethodId="pm_test_123"
        data-testid="submit-order-button"
      />
    )

    await user.click(screen.getByRole("button", { name: /place order/i }))

    await waitFor(() => {
      expect(mockVerifyInventory).toHaveBeenCalledWith("cart_test")
      expect(mockPlaceOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodId: "pm_test_123",
          setupIntentId: null,
          consentVersion: "catch-weight-final-charge-2026-05-31",
        })
      )
    })
  })
})

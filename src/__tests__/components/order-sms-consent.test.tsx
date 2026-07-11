import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { setOrderSmsConsent } from "@lib/data/cart"
import {
  buildOrderSmsConsentMetadata,
  ORDER_SMS_CONSENT_METHOD,
  ORDER_SMS_CONSENT_SOURCE,
  ORDER_SMS_CONSENT_VERSION,
  ORDER_SMS_DISCLOSURE,
  ORDER_SMS_PROGRAM,
  ORDER_SMS_PROVIDER,
  ORDER_SMS_PURPOSE,
} from "@lib/util/order-sms-consent"
import OrderSmsConsent from "@modules/checkout/components/order-sms-consent"

jest.mock("@lib/data/cart", () => ({
  setOrderSmsConsent: jest.fn(),
}))

const mockedSetOrderSmsConsent = setOrderSmsConsent as jest.MockedFunction<
  typeof setOrderSmsConsent
>

const cart = {
  id: "cart_order_sms",
  shipping_address: { phone: "4045551212" },
  metadata: { fulfillmentType: "ups_shipping" },
}

function renderConsent(testCart: any = cart) {
  return render(
    <OrderSmsConsent cart={testCart}>
      {({ orderPlacementBlocked }) => (
        <button disabled={orderPlacementBlocked} type="button">
          Place Order
        </button>
      )}
    </OrderSmsConsent>
  )
}

describe("delivery-only order SMS consent", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedSetOrderSmsConsent.mockResolvedValue({} as never)
  })

  it("is optional and unchecked with separate country-aware legal links", () => {
    renderConsent()

    const checkbox = screen.getByRole("checkbox", {
      name: ORDER_SMS_DISCLOSURE,
    })
    expect(checkbox).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled()
    expect(screen.getByRole("link", { name: "SMS Terms" })).toHaveAttribute(
      "href",
      "/us/page/order-sms-terms"
    )
    expect(
      screen.getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", "/us/page/order-sms-privacy")
  })

  it("is unavailable outside UPS shipping and removes any prior grant", async () => {
    const granted = buildOrderSmsConsentMetadata({
      granted: true,
      phone: "4045551212",
      timestamp: "2026-07-11T00:00:00.000Z",
    })

    renderConsent({
      ...cart,
      metadata: {
        fulfillmentType: "atlanta_delivery",
        order_sms_consent: granted,
      },
    })

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled()
    await waitFor(() =>
      expect(mockedSetOrderSmsConsent).toHaveBeenCalledWith({
        cartId: "cart_order_sms",
        granted: false,
      })
    )
  })

  it("blocks order placement only while an opt-in is being persisted", async () => {
    const user = userEvent.setup()
    let resolveSave: ((value: unknown) => void) | undefined
    mockedSetOrderSmsConsent.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      }) as never
    )
    renderConsent()

    await user.click(screen.getByRole("checkbox"))

    expect(mockedSetOrderSmsConsent).toHaveBeenCalledWith({
      cartId: "cart_order_sms",
      granted: true,
    })
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled()

    resolveSave?.({})
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled()
    )
  })

  it("persists an explicit sparse revocation when unchecked", async () => {
    const user = userEvent.setup()
    const granted = buildOrderSmsConsentMetadata({
      granted: true,
      phone: "4045551212",
      timestamp: "2026-07-11T00:00:00.000Z",
    })
    renderConsent({
      ...cart,
      metadata: { ...cart.metadata, order_sms_consent: granted },
    })

    expect(screen.getByRole("checkbox")).toBeChecked()
    await user.click(screen.getByRole("checkbox"))

    await waitFor(() =>
      expect(mockedSetOrderSmsConsent).toHaveBeenCalledWith({
        cartId: "cart_order_sms",
        granted: false,
      })
    )
  })

  it("revokes a granted choice when the fulfillment phone changes", async () => {
    let resolveSave: ((value: unknown) => void) | undefined
    mockedSetOrderSmsConsent.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      }) as never
    )
    const grantedForOldPhone = buildOrderSmsConsentMetadata({
      granted: true,
      phone: "4045559999",
      timestamp: "2026-07-11T00:00:00.000Z",
    })

    renderConsent({
      ...cart,
      metadata: { ...cart.metadata, order_sms_consent: grantedForOldPhone },
    })

    expect(screen.getByRole("checkbox")).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled()
    await waitFor(() =>
      expect(mockedSetOrderSmsConsent).toHaveBeenCalledWith({
        cartId: "cart_order_sms",
        granted: false,
      })
    )

    resolveSave?.({})
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled()
    )
  })

  it("builds the exact evidence object and removes sensitive fields on opt-out", () => {
    const timestamp = "2026-07-11T12:34:56.000Z"
    expect(
      buildOrderSmsConsentMetadata({
        granted: true,
        phone: "4045551212",
        timestamp,
      })
    ).toEqual({
      granted: true,
      phone: "4045551212",
      timestamp,
      version: ORDER_SMS_CONSENT_VERSION,
      disclosure: ORDER_SMS_DISCLOSURE,
      source: ORDER_SMS_CONSENT_SOURCE,
      provider: ORDER_SMS_PROVIDER,
      program: ORDER_SMS_PROGRAM,
      purpose: ORDER_SMS_PURPOSE,
      method: ORDER_SMS_CONSENT_METHOD,
    })

    expect(buildOrderSmsConsentMetadata({ granted: false })).toEqual({
      granted: false,
      version: ORDER_SMS_CONSENT_VERSION,
      source: ORDER_SMS_CONSENT_SOURCE,
      provider: ORDER_SMS_PROVIDER,
      program: ORDER_SMS_PROGRAM,
      purpose: ORDER_SMS_PURPOSE,
      method: ORDER_SMS_CONSENT_METHOD,
    })
  })
})

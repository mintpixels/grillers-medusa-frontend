import { RadioGroup } from "@headlessui/react"
import { act, render, screen } from "@testing-library/react"

import { StripeCardContainer } from "@modules/checkout/components/payment-container"
import { StripeContext } from "@modules/checkout/components/payment-wrapper/stripe-wrapper"

const mockUseStripe = jest.fn()
const mockUseElements = jest.fn()
const mockCardElement = jest.fn()

jest.mock("@stripe/react-stripe-js", () => {
  const React = require("react")

  return {
    CardElement: (props: any) => {
      mockCardElement(props)
      React.useEffect(() => {
        props.onReady?.({})
      }, [props])

      return <div data-testid="stripe-card-element" />
    },
    useStripe: () => mockUseStripe(),
    useElements: () => mockUseElements(),
  }
})

const paymentProviderId = "pp_stripe_stripe"

const renderStripeCardContainer = ({
  setupIntentClientSecret = null,
  isPreparingSetupIntent = false,
  stripeProviderMounted = true,
}: {
  setupIntentClientSecret?: string | null
  isPreparingSetupIntent?: boolean
  stripeProviderMounted?: boolean
} = {}) => {
  const props = {
    paymentProviderId,
    selectedPaymentOptionId: paymentProviderId,
    paymentInfoMap: {
      [paymentProviderId]: {
        title: "Credit card",
        icon: <span aria-hidden="true" />,
      },
    },
    setCardBrand: jest.fn(),
    setError: jest.fn(),
    setCardComplete: jest.fn(),
    setupIntentClientSecret,
    isPreparingSetupIntent,
  }

  render(
    <StripeContext.Provider value={stripeProviderMounted}>
      <RadioGroup value={paymentProviderId} onChange={() => {}}>
        <StripeCardContainer {...props} />
      </RadioGroup>
    </StripeContext.Provider>
  )

  return props
}

describe("StripeCardContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStripe.mockReturnValue({ id: "stripe" })
    mockUseElements.mockReturnValue({ id: "elements" })
  })

  it("does not mount Stripe CardElement before checkout has a setup intent", () => {
    renderStripeCardContainer({ isPreparingSetupIntent: true })

    expect(
      screen.getByText("Preparing secure card setup...")
    ).toBeInTheDocument()
    expect(mockCardElement).not.toHaveBeenCalled()
  })

  it("keeps showing a loading state until Stripe hooks are usable", () => {
    mockUseStripe.mockReturnValue(null)
    mockUseElements.mockReturnValue(null)

    renderStripeCardContainer({
      setupIntentClientSecret: "seti_secret_test",
    })

    expect(screen.queryByTestId("stripe-card-element")).not.toBeInTheDocument()
    expect(mockCardElement).not.toHaveBeenCalled()
  })

  it("mounts the card element only after the setup intent and Stripe Elements are ready", () => {
    const props = renderStripeCardContainer({
      setupIntentClientSecret: "seti_secret_test",
    })

    expect(screen.getByTestId("stripe-card-element")).toBeInTheDocument()
    expect(mockCardElement).toHaveBeenCalledTimes(1)

    act(() => {
      mockCardElement.mock.calls[0][0].onChange({
        brand: "visa",
        complete: true,
        error: undefined,
      })
    })

    expect(props.setCardBrand).toHaveBeenCalledWith("Visa")
    expect(props.setError).toHaveBeenCalledWith(null)
    expect(props.setCardComplete).toHaveBeenCalledWith(true)
  })
})

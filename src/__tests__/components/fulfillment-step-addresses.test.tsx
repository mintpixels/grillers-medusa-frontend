import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import FulfillmentStep from "@modules/checkout/components/fulfillment-step"
import { saveAddressToProfileAndCart } from "@lib/data/customer"

const routerRefresh = jest.fn()
const setIsEditingFulfillment = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
  }),
}))

jest.mock("@modules/checkout/context/fulfillment-edit-context", () => ({
  useFulfillmentEdit: () => ({
    setIsEditingFulfillment,
  }),
}))

jest.mock("@lib/data/cart", () => ({
  clearFulfillmentDetails: jest.fn(),
  setFulfillmentDetails: jest.fn(),
  setShippingMethod: jest.fn(),
}))

jest.mock("@lib/data/customer", () => ({
  saveAddressToProfileAndCart: jest.fn(),
}))

jest.mock("@lib/data/fulfillment", () => ({
  findShippingOptionByType: jest.fn(),
}))

jest.mock(
  "@modules/checkout/components/fulfillment-selector/scheduling/plant-pickup",
  () => ({
    __esModule: true,
    default: () => <div>Plant pickup scheduling</div>,
  })
)

jest.mock(
  "@modules/checkout/components/fulfillment-selector/scheduling/southeast-pickup",
  () => ({
    __esModule: true,
    default: () => <div>Southeast pickup scheduling</div>,
  })
)

jest.mock(
  "@modules/checkout/components/fulfillment-selector/scheduling/atlanta-delivery",
  () => ({
    __esModule: true,
    default: () => <div>Atlanta delivery scheduling</div>,
  })
)

const mockSaveAddressToProfileAndCart =
  saveAddressToProfileAndCart as jest.MockedFunction<
    typeof saveAddressToProfileAndCart
  >

const currentAddress = {
  id: "addr_current",
  first_name: "Avner",
  last_name: "Swerdlow",
  address_1: "220 Glen Meadow Ct",
  city: "Sandy Springs",
  province: "GA",
  postal_code: "30328",
  country_code: "us",
  is_default_shipping: true,
}

const incompleteAddress = {
  id: "addr_missing_state",
  first_name: "Avner",
  last_name: "Swerdlow",
  address_1: "220 Glen Meadow Court",
  city: "Sandy Springs",
  province: "",
  postal_code: "30328",
  country_code: "us",
}

const scrambledAddress = {
  id: "addr_scrambled",
  first_name: "Avner",
  last_name: "Swerdlow",
  address_1: "220 Glen Meadow Ct",
  city: "GA",
  province: "30328",
  postal_code: "Sandy Springs",
  country_code: "us",
}

const cart = {
  id: "cart_test",
  total: 35139,
  currency_code: "usd",
  items: [],
  shipping_address: currentAddress,
  shipping_methods: [],
  metadata: {},
} as any

const customer = {
  id: "cus_test",
  first_name: "Avi",
  last_name: "Swerdlow",
  phone: "7704548108",
  addresses: [currentAddress, incompleteAddress],
} as any

const checkoutConfig = {
  AtlantaDeliveryZipCodes: ["30328"],
  SoutheastPickupLocations: [],
  MinimumOrderThresholds: {
    UPSShipping: 40,
    AtlantaDelivery: 100,
    PlantPickup: 0,
    SoutheastPickup: 0,
  },
} as any

describe("FulfillmentStep saved address selection", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSaveAddressToProfileAndCart.mockResolvedValue({ success: true } as any)
  })

  it("repairs historically scrambled cart address fields before checking Atlanta delivery eligibility", () => {
    render(
      <FulfillmentStep
        cart={
          {
            ...cart,
            shipping_address: scrambledAddress,
          } as any
        }
        customer={{ ...customer, addresses: [] } as any}
        config={checkoutConfig}
        availableFulfillmentTypes={[
          "ups_shipping",
          "atlanta_delivery",
          "plant_pickup",
          "southeast_pickup",
        ]}
        pickupCreditConfig={{
          threshold: 250,
          creditAmount: 750,
          promoCode: "PLANTPICKUP750",
        }}
      />
    )

    expect(
      screen.queryByText(
        "Local delivery and pickup aren't available for this address"
      )
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/220 Glen Meadow Ct, Sandy Springs, GA 30328/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /Atlanta Delivery Local to your door/,
      })
    ).not.toBeDisabled()
  })

  it("prevents incomplete saved addresses from being selected for checkout", async () => {
    const user = userEvent.setup()

    render(
      <FulfillmentStep
        cart={cart}
        customer={customer}
        config={checkoutConfig}
        availableFulfillmentTypes={[
          "ups_shipping",
          "atlanta_delivery",
          "plant_pickup",
          "southeast_pickup",
        ]}
        pickupCreditConfig={{
          threshold: 250,
          creditAmount: 750,
          promoCode: "PLANTPICKUP750",
        }}
      />
    )

    await user.click(screen.getByRole("button", { name: "Change" }))

    expect(
      screen.getByText("220 Glen Meadow Court, Sandy Springs 30328")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Missing city, state, or ZIP. Edit before using.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Edit 220 Glen Meadow Court, Sandy Springs 30328 before using",
      })
    ).toBeDisabled()

    await user.click(
      screen.getByRole("button", {
        name: "Edit 220 Glen Meadow Court, Sandy Springs 30328 before using",
      })
    )

    expect(mockSaveAddressToProfileAndCart).not.toHaveBeenCalled()
  })
})

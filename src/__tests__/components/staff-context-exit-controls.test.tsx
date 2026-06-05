import { fireEvent, render, screen } from "@testing-library/react"

import CheckoutLoginBanner from "@modules/checkout/components/checkout-login-banner"
import AccountMenu from "@modules/layout/components/account-menu"
import { useStorefrontSession } from "@modules/layout/components/storefront-session"
import { useExitStaffContext } from "@modules/staff/hooks/use-exit-staff-context"

jest.mock("@modules/layout/components/storefront-session", () => ({
  useStorefrontSession: jest.fn(),
}))

jest.mock("@modules/staff/hooks/use-exit-staff-context", () => ({
  useExitStaffContext: jest.fn(),
}))

jest.mock("@lib/data/customer", () => ({
  loginWithCredentials: jest.fn(),
  signupWithCredentials: jest.fn(),
  signout: jest.fn(),
  signoutKeepCart: jest.fn(),
  requestPasswordReset: jest.fn(),
}))

const mockedUseStorefrontSession = useStorefrontSession as jest.MockedFunction<
  typeof useStorefrontSession
>
const mockedUseExitStaffContext = useExitStaffContext as jest.MockedFunction<
  typeof useExitStaffContext
>

const staffImpersonation = {
  staffName: "Avi Swerdlow",
  targetName: "Meyer Greenberg",
}

describe("staff context exit controls", () => {
  const exitContext = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseStorefrontSession.mockReturnValue({
      customer: null,
      staffImpersonation,
      cart: null,
      cartItemCount: 0,
      shippingOptions: [],
      deliveryZip: null,
      deliveryZipSource: null,
      loaded: true,
      refreshing: false,
      refreshSession: jest.fn(),
    })
    mockedUseExitStaffContext.mockReturnValue({
      exitContext,
      isExiting: false,
    })
  })

  it("turns the checkout signed-in banner logout into exit context", () => {
    render(
      <CheckoutLoginBanner
        customer={
          {
            id: "cus_target",
            first_name: "Meyer",
            last_name: "Greenberg",
          } as any
        }
      />
    )

    expect(screen.getByText("Acting as")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Exit context" }))

    expect(exitContext).toHaveBeenCalledTimes(1)
  })

  it("keeps staff console access and exits context from the account menu", () => {
    render(
      <AccountMenu initials="MG" firstName="Meyer" canUseStaffTools={false} />
    )

    fireEvent.click(screen.getByRole("button", { name: "My account" }))

    expect(screen.getByText("Staff")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Exit context" }))

    expect(exitContext).toHaveBeenCalledTimes(1)
  })
})

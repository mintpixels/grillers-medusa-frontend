import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import ItemsTemplate from "./items"
import Summary from "./summary"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-10">
            <div className="flex flex-col bg-white py-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <div className="my-8 border-b border-gray-200" />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="bg-white py-6">
                      <Summary cart={cart as any} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyCartMessage />
        )}
        <div className="mt-12">
          <LocalizedClientLink
            href="/store"
            className="text-Gold hover:text-Gold/80 font-medium"
          >
            ← Continue shopping
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default CartTemplate

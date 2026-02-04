import { HttpTypes } from "@medusajs/types"
import CartPageContent from "../components/cart-page-content"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  // Cart page now auto-opens the side cart and shows minimal content
  return <CartPageContent />
}

export default CartTemplate

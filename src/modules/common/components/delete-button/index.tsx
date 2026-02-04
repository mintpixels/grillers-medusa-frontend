import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trackRemoveFromCart } from "@lib/gtm"

type ProductInfo = {
  id: string
  title: string
  price?: number
  quantity: number
  currency?: string
}

const DeleteButton = ({
  id,
  children,
  className,
  productInfo,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  productInfo?: ProductInfo
}) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    
    // Track remove_from_cart event before deletion
    if (productInfo) {
      trackRemoveFromCart({
        id: productInfo.id,
        title: productInfo.title,
        price: productInfo.price,
        quantity: productInfo.quantity,
        currency: productInfo.currency,
      })
    }
    
    await deleteLineItem(id)
      .then(() => {
        // Refresh to get updated cart data from server
        router.refresh()
      })
      .catch((err) => {
        setIsDeleting(false)
      })
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton

import { Hits } from "react-instantsearch"

import ProductCard from "@modules/algolia/components/product-card"

const ProductCardHits = () => (
  <Hits
    hitComponent={ProductCard}
    classNames={{
      list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
      item: "",
    }}
  />
)
export default ProductCardHits

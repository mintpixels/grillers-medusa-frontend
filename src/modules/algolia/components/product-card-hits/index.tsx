import { Hits } from "react-instantsearch"

import ProductCard from "@modules/algolia/components/product-card"
import ProductListItem from "@modules/algolia/components/product-list-item"
import { ViewMode } from "@modules/algolia/components/view-toggle"

interface ProductCardHitsProps {
  viewMode?: ViewMode
}

const ProductCardHits = ({ viewMode = "grid" }: ProductCardHitsProps) => (
  <Hits
    hitComponent={viewMode === "grid" ? ProductCard : ProductListItem}
    classNames={{
      list: viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        : "flex flex-col gap-4",
      item: "",
    }}
  />
)
export default ProductCardHits

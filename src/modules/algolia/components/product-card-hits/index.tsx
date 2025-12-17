"use client"

import { useEffect, useRef } from "react"
import { Hits, useHits } from "react-instantsearch"
import { trackViewItemList } from "@lib/gtm"

import ProductCard from "@modules/algolia/components/product-card"
import ProductListItem from "@modules/algolia/components/product-list-item"
import { ViewMode } from "@modules/algolia/components/view-toggle"

interface ProductCardHitsProps {
  viewMode?: ViewMode
  listId?: string
  listName?: string
}

// Component to track view_item_list when hits change
function ViewItemListTracker({ listId, listName }: { listId: string; listName: string }) {
  const { items } = useHits()
  const lastTrackedIds = useRef<string>("")

  useEffect(() => {
    if (items.length > 0) {
      // Create a unique key for the current set of items
      const itemsKey = items.map((item: any) => item.objectID).join(",")
      
      // Only track if items have changed
      if (itemsKey !== lastTrackedIds.current) {
        lastTrackedIds.current = itemsKey
        
        trackViewItemList({
          listId,
          listName,
          items: items.slice(0, 12).map((item: any, index: number) => ({
            id: item.MedusaProduct?.Id || item.objectID,
            title: item.Title || item.name,
            price: item.MedusaProduct?.Variants?.[0]?.calculated_price?.calculated_amount 
              ? item.MedusaProduct.Variants[0].calculated_price.calculated_amount / 100 
              : undefined,
            position: index,
          })),
        })
      }
    }
  }, [items, listId, listName])

  return null
}

const ProductCardHits = ({ 
  viewMode = "grid",
  listId = "collection",
  listName = "Collection",
}: ProductCardHitsProps) => (
  <>
    <ViewItemListTracker listId={listId} listName={listName} />
    <Hits
      hitComponent={viewMode === "grid" ? ProductCard : ProductListItem}
      classNames={{
        list: viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          : "flex flex-col gap-4",
        item: "",
      }}
    />
  </>
)
export default ProductCardHits

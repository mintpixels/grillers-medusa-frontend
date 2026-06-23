"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { useStrapiThumbnailMap } from "@lib/hooks/use-strapi-thumbnail-map"

type Props = {
  items: NonNullable<HttpTypes.StoreOrder["items"]>
}

/**
 * Stacked product thumbnails for an order row. Order line items snapshot a
 * Medusa `thumbnail`, but Grillers Pride product images live in Strapi, so that
 * field is usually empty — fall back to the Strapi FeaturedImage by Medusa
 * product_id (same as the full orders list) instead of a blank grey placeholder.
 */
export default function OrderThumbnailStack({ items }: Props) {
  const productIds = items
    .map((i) => i.product_id)
    .filter((id): id is string => Boolean(id))
  const strapiThumbnailMap = useStrapiThumbnailMap(productIds)

  return (
    <div className="flex -space-x-2 shrink-0">
      {items.slice(0, 3).map((item, idx) => {
        const thumb =
          item.thumbnail ||
          (item.product_id ? strapiThumbnailMap[item.product_id] : "") ||
          ""
        return (
          <div
            key={item.id}
            className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 overflow-hidden"
            style={{ zIndex: 3 - idx }}
          >
            {thumb && (
              <Image
                src={thumb}
                alt={item.product_title || ""}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )
      })}
      {items.length > 3 && (
        <div className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-maison-neue text-Charcoal/60">
          +{items.length - 3}
        </div>
      )}
    </div>
  )
}

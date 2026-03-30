import { Metadata } from "next"
import { listPurchaseHistory } from "@lib/data/orders"
import { getProductsByMedusaIds, type StrapiCollectionProduct } from "@lib/data/strapi/collections"
import strapiClient from "@lib/strapi"
import ReorderBrowser from "@modules/account/components/reorder-browser"

export const metadata: Metadata = {
  title: "Reorder | Grillers Pride",
  description: "Quickly reorder your favorite products.",
}

export default async function ReorderPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const history = await listPurchaseHistory()
  const productIds = [...new Set(history.map((h) => h.productId).filter(Boolean))]

  const strapiProducts = await getProductsByMedusaIds(productIds, strapiClient)

  const strapiMap: Record<string, StrapiCollectionProduct> = {}
  for (const sp of strapiProducts) {
    if (sp.MedusaProduct?.ProductId) {
      strapiMap[sp.MedusaProduct.ProductId] = sp
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 font-gyst font-bold text-Charcoal">Quick Reorder</h1>
        <p className="text-sm font-maison-neue text-Charcoal/50 mt-1">
          Browse and reorder from your purchase history
        </p>
      </div>
      <ReorderBrowser
        history={history}
        strapiMap={strapiMap}
        countryCode={countryCode}
      />
    </div>
  )
}

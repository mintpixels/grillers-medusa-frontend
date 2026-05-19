export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import {
  listAllLegacyCustomerOrders,
  listPurchaseHistory,
} from "@lib/data/orders"
import {
  getProductsByMedusaLookupRefs,
  type StrapiCollectionProduct,
} from "@lib/data/strapi/collections"
import strapiClient from "@lib/strapi"
import ReorderBrowser from "@modules/account/components/reorder-browser"
import LoginTemplate from "@modules/account/templates/login-template"

function presentString(value: string | null | undefined): value is string {
  return Boolean(value)
}

export const metadata: Metadata = {
  title: "Reorder | Grillers Pride",
  description: "Restock from your Grillers Pride purchase history.",
}

export default async function ReorderPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams?: Promise<{ start?: string }>
}) {
  const { countryCode } = await params
  const resolvedSearchParams = await searchParams
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return <LoginTemplate />
  }

  const [history, legacyOrderHistory] = await Promise.all([
    listPurchaseHistory(),
    listAllLegacyCustomerOrders(),
  ])
  const productIds = Array.from(
    new Set(history.map((h) => h.productId).filter(presentString))
  )
  const variantIds = Array.from(
    new Set(history.map((h) => h.variantId).filter(presentString))
  )
  const skus = Array.from(
    new Set(history.map((h) => h.sku).filter(presentString))
  )

  const strapiProducts = await getProductsByMedusaLookupRefs(
    { productIds, variantIds, skus },
    strapiClient
  )

  const strapiMap: Record<string, StrapiCollectionProduct> = {}
  for (const sp of strapiProducts) {
    if (sp.MedusaProduct?.ProductId) {
      strapiMap[sp.MedusaProduct.ProductId] = sp
    }
    for (const variant of sp.MedusaProduct?.Variants || []) {
      if (variant.VariantId) {
        strapiMap[variant.VariantId] = sp
      }
      if (variant.Sku) {
        strapiMap[variant.Sku.trim().toLowerCase()] = sp
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 font-gyst font-bold text-Charcoal">Reorder</h1>
        <p className="text-sm font-maison-neue text-Charcoal/50 mt-1">
          Restock from your usuals, staples, and past orders.
        </p>
      </div>
      <ReorderBrowser
        history={history}
        legacyOrders={legacyOrderHistory.orders || []}
        legacyOrderCount={legacyOrderHistory.count || 0}
        strapiMap={strapiMap}
        countryCode={countryCode}
        initialAction={
          resolvedSearchParams?.start === "usuals" ? "usuals" : undefined
        }
      />
    </div>
  )
}

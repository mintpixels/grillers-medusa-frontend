import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getProductMerchandisingTags } from "@lib/data/staff/product-merchandising"
import { isStaffCustomer } from "@lib/util/staff-access"
import ProductMerchandisingTable from "@modules/staff/components/product-merchandising-table"
import { Loader2 } from "lucide-react"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Product merchandising | Griller's Pride",
  description: "Staff-only product image merchandising review.",
  robots: {
    index: false,
    follow: false,
  },
}

function ProductMerchandisingLoading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-gray-200 bg-white">
      <div className="text-center">
        <Loader2
          className="mx-auto h-8 w-8 animate-spin text-Gold"
          aria-hidden
        />
        <p className="mt-4 text-xs font-maison-neue-mono uppercase text-Charcoal/50">
          Loading data from Strapi
        </p>
      </div>
    </div>
  )
}

async function ProductMerchandisingTableData() {
  const tags = await getProductMerchandisingTags()
  return <ProductMerchandisingTable tags={tags} />
}

export default async function StaffProductMerchandisingPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!isStaffCustomer(customer)) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 large:flex-row large:items-end large:justify-between">
        <div>
          <p className="text-xs font-maison-neue-mono uppercase text-Gold">
            Staff tools
          </p>
          <h1 className="mt-2 text-h3 font-gyst font-bold text-Charcoal">
            Product merchandising
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-maison-neue text-Charcoal/60">
            L3 product tag groups with photo counts, review progress, and
            metadata signals pulled from Strapi.
          </p>
        </div>
      </div>

      <Suspense fallback={<ProductMerchandisingLoading />}>
        <ProductMerchandisingTableData />
      </Suspense>
    </div>
  )
}

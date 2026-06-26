import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { getProductMerchandisingDetail } from "@lib/data/staff/product-merchandising"
import { canReviewMerchandising, staffDisplayName } from "@lib/util/staff-access"
import ProductMerchandisingDetailView from "@modules/staff/components/product-merchandising-detail"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "L3 merchandising review | Griller's Pride",
  description: "Staff-only L3 product image review.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function StaffProductMerchandisingDetailPage({
  params,
}: {
  params: Promise<{ countryCode: string; tagId: string }>
}) {
  const { countryCode, tagId } = await params
  const customer = await retrieveAuthenticatedCustomerForStaffAccess()

  if (!customer) {
    redirect(`/${countryCode}/account`)
  }

  if (!canReviewMerchandising(customer)) {
    notFound()
  }

  const detail = await getProductMerchandisingDetail(tagId)

  if (!detail) {
    notFound()
  }

  return (
    <ProductMerchandisingDetailView
      countryCode={countryCode}
      detail={detail}
      staffEmail={customer.email || ""}
      staffName={staffDisplayName(customer)}
    />
  )
}

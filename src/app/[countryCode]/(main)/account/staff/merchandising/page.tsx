import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Product merchandising now lives inside the unified staff console as a
// workspace. Keep this route so existing bookmarks/links forward cleanly.
export default async function StaffProductMerchandisingRedirect({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  redirect(`/${countryCode}/account/staff/orders?workspace=merchandising`)
}

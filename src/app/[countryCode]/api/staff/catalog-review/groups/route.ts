import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Country-scoped staff feed for existing login cookies. The storefront auth
// cookie historically defaulted to the country path (for example `/us`), so a
// root `/api/...` fetch can miss the staff session until the user signs in
// again. This route preserves current staff sessions while the root endpoint
// stays as a compatibility shim.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params

  return handleStaffMerchandisingTagsRequest({
    routePath: `src/app/${countryCode}/api/staff/catalog-review/groups/route.ts`,
  })
}

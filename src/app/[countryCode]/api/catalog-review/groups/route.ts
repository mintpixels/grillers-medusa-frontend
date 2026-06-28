import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Country-scoped neutral staff feed for existing login cookies. Keep the URL
// free of marketing/staff terms so browser privacy filters do not strand the
// merchandising workspace when it falls back from server-preloaded data.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params

  return handleStaffMerchandisingTagsRequest({
    routePath: `src/app/${countryCode}/api/catalog-review/groups/route.ts`,
  })
}

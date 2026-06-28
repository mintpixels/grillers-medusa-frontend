import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Browser-profile-safe staff feed for the merchandising workspace. Some
// privacy filters block top-level /api/ URLs, so the client tries this account
// URL before the API compatibility aliases.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params

  return handleStaffMerchandisingTagsRequest({
    routePath: `src/app/${countryCode}/(main)/account/catalog-review/groups/route.ts`,
  })
}

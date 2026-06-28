import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Browser-profile-safe staff feed for the merchandising workspace. Some
// privacy filters block /api/ or catalog-review style data URLs, so the client
// tries this account URL first. The shared handler still enforces staff access.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params

  return handleStaffMerchandisingTagsRequest({
    routePath: `src/app/${countryCode}/(main)/account/photo-groups/data/route.ts`,
    responseFormat: "text",
  })
}

import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Second browser-profile-safe account feed for the merchandising workspace.
// Some Chrome profiles block every /api/ fallback, so the client keeps this
// non-API account URL available before trying API-style routes.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params

  return handleStaffMerchandisingTagsRequest({
    routePath: `src/app/${countryCode}/(main)/account/photo-groups/snapshot/route.ts`,
    responseFormat: "html",
  })
}

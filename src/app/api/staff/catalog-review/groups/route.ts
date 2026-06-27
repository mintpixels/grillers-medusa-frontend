import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Neutral URL for the staff catalog-review data feed. Some browser privacy
// filters block request paths containing marketing terms, so the client uses
// this route while the older merchandising URL remains as a compatibility shim.
export async function GET() {
  return handleStaffMerchandisingTagsRequest({
    routePath: "src/app/api/staff/catalog-review/groups/route.ts",
  })
}

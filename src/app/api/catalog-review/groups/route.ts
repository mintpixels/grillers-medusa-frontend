import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Root compatibility alias for sessions whose auth cookie is available at the
// site root. The country-scoped route is preferred by the workspace.
export async function GET() {
  return handleStaffMerchandisingTagsRequest({
    routePath: "src/app/api/catalog-review/groups/route.ts",
  })
}

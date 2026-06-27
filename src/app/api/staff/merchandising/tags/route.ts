import { handleStaffMerchandisingTagsRequest } from "@lib/staff-merchandising-tags-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

// Plain GET endpoint for the staff merchandising workspace. The workspace lives
// inside the staff console (a force-dynamic page), and clicking its tile fires a
// client navigation. Next.js serializes Server Actions behind an in-flight
// navigation, so fetching the tags via a Server Action from the freshly-mounted
// workspace deadlocks (the action never dispatches and the spinner hangs). A
// plain fetch to this route is not serialized behind the navigation, so it
// dispatches immediately. Auth is enforced by getProductMerchandisingTags()
// itself (requires the merchandising-reviewer or super-admin capability).
export async function GET() {
  return handleStaffMerchandisingTagsRequest({
    routePath: "src/app/api/staff/merchandising/tags/route.ts",
  })
}

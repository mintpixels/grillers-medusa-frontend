import { getProductMerchandisingTags } from "@lib/data/staff/product-merchandising"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Plain GET endpoint for the staff merchandising workspace. The workspace lives
// inside the staff console (a force-dynamic page), and clicking its tile fires a
// client navigation. Next.js serializes Server Actions behind an in-flight
// navigation, so fetching the tags via a Server Action from the freshly-mounted
// workspace deadlocks (the action never dispatches and the spinner hangs). A
// plain fetch to this route is not serialized behind the navigation, so it
// dispatches immediately. Auth is enforced by getProductMerchandisingTags()
// itself (requires the merchandising-reviewer or super-admin capability).
export async function GET() {
  try {
    const tags = await getProductMerchandisingTags()
    return NextResponse.json({ tags })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load merchandising data."
    const status = /access required/i.test(message) ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

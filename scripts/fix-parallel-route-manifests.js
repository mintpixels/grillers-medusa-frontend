#!/usr/bin/env node
/**
 * Workaround for a Next.js 15 bug with parallel routes nested inside a
 * dynamic segment: pages under @dashboard / @login slots reference
 * `page_client-reference-manifest.js` in their .nft.json file traces, but
 * Next never actually emits the manifest. Vercel's deploy step then fails
 * with `ENOENT: no such file or directory ... page_client-reference-manifest.js`,
 * and at runtime the React Server Components renderer throws
 * "Could not find the module ... in the React Client Manifest" for every
 * shared module (LocalizedClientLink, global-error, MetadataBoundary, …).
 *
 * See: https://github.com/vercel/next.js/issues/76148
 *
 * Original workaround wrote a 58-byte empty stub. It silenced Vercel's
 * deploy-time tracer but every parallel-slot route still 500'd at runtime.
 *
 * Improved workaround: borrow the manifest from a working sibling page
 * under the same parent layout (i.e. `wishlist` for /us/account/*). That
 * sibling's manifest already contains the full clientModules /
 * ssrModuleMapping for every client component reachable via the shared
 * layout — exactly what the broken parallel-slot pages need at runtime.
 * We rewrite the route-key field to match the broken page so React's
 * `globalThis.__RSC_MANIFEST[routeKey]` lookup resolves successfully.
 */

const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".next", "server", "app")

if (!fs.existsSync(ROOT)) {
  console.log("[fix-parallel-route-manifests] no .next/server/app — skipping")
  process.exit(0)
}

// Derive the route key Next.js uses internally for a given .next/server/app
// page directory. Example:
//   .next/server/app/[countryCode]/(main)/account/@dashboard/orders
//   → "/[countryCode]/(main)/account/@dashboard/orders/page"
function deriveRouteKey(pageDir) {
  const rel = path.relative(ROOT, pageDir)
  return "/" + rel.split(path.sep).join("/") + "/page"
}

// Donor manifest: any working sibling under the same parent layout will do.
// /[countryCode]/(main)/account/wishlist is a regular nested route (not a
// parallel-slot route), so its manifest is fully populated — and it sits
// under the exact same layout chain as the broken @dashboard / @login
// pages, so the client modules it references are the right set.
const DONOR_PATH = path.join(
  ROOT,
  "[countryCode]",
  "(main)",
  "account",
  "wishlist",
  "page_client-reference-manifest.js"
)

let donor = null
if (fs.existsSync(DONOR_PATH)) {
  donor = fs.readFileSync(DONOR_PATH, "utf8")
}

function manifestFor(routeKey) {
  if (donor) {
    // Donor file shape:
    //   globalThis.__RSC_MANIFEST=...;
    //   globalThis.__RSC_MANIFEST["<donorKey>"]={...payload...};
    // Replace just the route key — keep the payload (clientModules etc.)
    // verbatim. The donor key sits between the first pair of double
    // quotes after `__RSC_MANIFEST[`.
    return donor.replace(
      /globalThis\.__RSC_MANIFEST\["[^"]+"\]/,
      `globalThis.__RSC_MANIFEST[${JSON.stringify(routeKey)}]`
    )
  }
  // Fallback if the donor is missing — still better than the original
  // 58-byte stub since it at least registers the route key, but client
  // modules will be missing and pages with client components will 500.
  const payload = {
    moduleLoading: { prefix: "/_next/", crossOrigin: null },
    clientModules: {},
    ssrModuleMapping: {},
    edgeSSRModuleMapping: {},
    entryCSSFiles: {},
    rscModuleMapping: {},
    edgeRscModuleMapping: {},
  }
  return (
    `globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});` +
    `globalThis.__RSC_MANIFEST[${JSON.stringify(routeKey)}]=` +
    JSON.stringify(payload) +
    `;`
  )
}

let patched = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (entry.name !== "page.js.nft.json") continue

    const trace = fs.readFileSync(full, "utf8")
    if (!trace.includes("page_client-reference-manifest.js")) continue

    const manifestPath = path.join(dir, "page_client-reference-manifest.js")
    // If a real manifest already exists (≥10kB — populated with module
    // mappings), leave it alone. Otherwise overwrite — covers both the
    // missing-file case and any prior empty-stub or minimal workaround.
    if (fs.existsSync(manifestPath)) {
      const stat = fs.statSync(manifestPath)
      if (stat.size > 10_000) continue
    }

    const routeKey = deriveRouteKey(dir)
    fs.writeFileSync(manifestPath, manifestFor(routeKey))
    patched++
  }
}

walk(ROOT)
console.log(
  `[fix-parallel-route-manifests] generated ${patched} manifest file(s) with registered route keys`
)

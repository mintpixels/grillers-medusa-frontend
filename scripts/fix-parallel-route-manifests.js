#!/usr/bin/env node
/**
 * Workaround for a Next.js 15 bug with parallel routes nested inside a
 * dynamic segment: pages under @dashboard / @login slots reference
 * `page_client-reference-manifest.js` in their .nft.json file traces, but
 * Next never actually emits the manifest. Vercel's deploy step then fails
 * with `ENOENT: no such file or directory ... page_client-reference-manifest.js`.
 *
 * See: https://github.com/vercel/next.js/issues/76148
 *
 * This post-build step walks .next/server/app, finds every page directory
 * whose .nft.json references the missing manifest, and writes a minimal
 * empty manifest beside it. The manifest is only consumed at build/deploy
 * tracing time — the runtime page already has its own RSC payloads via the
 * regular client chunks, so the empty file is functionally harmless.
 */

const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".next", "server", "app")

if (!fs.existsSync(ROOT)) {
  console.log("[fix-parallel-route-manifests] no .next/server/app — skipping")
  process.exit(0)
}

const EMPTY_MANIFEST = `globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});`

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
    if (fs.existsSync(manifestPath)) continue

    fs.writeFileSync(manifestPath, EMPTY_MANIFEST)
    patched++
  }
}

walk(ROOT)
console.log(
  `[fix-parallel-route-manifests] generated ${patched} empty manifest file(s)`
)

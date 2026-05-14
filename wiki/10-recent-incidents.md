# 10 — Recent Incidents

A grep-friendly timeline of production incidents and the lesson each one produced. **Read this when you're touching code in the same neighborhood as a past incident** — chances are the bug class is still latent.

Format: `## [YYYY-MM-DD] <area> — <one-line symptom>`. Each entry has the lesson and a pointer to the rule it produced.

---

## [2026-05-13] Pricing — 4 bypass sites slipped past first Codex review

**Symptom:** Issues #104/#31 (catch-weight pricing on Peter's `10-08-22-1` and Mike Salguero's brisket) appeared fixed after `formatProductPriceDisplay` resolver landed. First Codex review of the diff returned clean. Both issues closed.

**Reality:** A deeper second Codex pass with "find every consumer" prompt found 4 P1/P2 bypass sites:
- Side-cart drawer
- Full-cart `NetWeightPricing` block (gated on weight presence, not resolver mode)
- Desktop search autocomplete
- Mobile search autocomplete (multi-variant SSR)

Each would have reproduced the original bug class for a customer.

**Fix:** Follow-up commit `bf5a74b` routed every surface through the resolver. Updated the surface audit in `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/pricing-mode-resolver-pattern.md` and the closed-issue top-comments.

**Lesson → rule:** "One adversarial review isn't enough when the change touches a shared abstraction." Codified in `~/.claude/rules/ship-an-issue-validation-gate.md` § Shared abstractions. See [[05-pricing-and-catch-weight]] § Two-pass Codex review.

---

## [2026-05-13] Strapi populate — 761 silent writes vaporized by `data:` wrapper

**Symptom:** A Python script populated `MedusaProduct.PricingMode` for 761 catalog entries via Strapi admin REST. Script ran 12 min, "succeeded" with 0 reported failures. Subsequent reads showed every `PricingMode` as `null`.

**Reality:** The script used `PUT … -d '{"data": {"MedusaProduct": {"PricingMode": ...}}}'`. Strapi 5's content-manager API silently drops the entire body when wrapped — 200 OK with field value `null` on every read.

**Fix:** Strip the `data:` wrapper; pass entry shape at top level. Validated via admin UI network-panel intercept of the canonical save request.

**Lesson → rule:** Public REST uses `{ "data": ... }` wrapper; admin content-manager does NOT. Codified in `~/.claude/rules/strapi-admin-edit.md` § THE `data:` WRAPPER TRAP. See [[06-critical-traps]] § ST-1.

---

## [2026-05-13] SpecialtyRow — 4 of 6 specialty products dropped from carousel after partial republish

**Symptom:** Home page Specialty Row showed only 2 of 6 expected products after a partial backfill that published ~225 entries.

**Reality:** `SPECIALTY_PRODUCT_IDS = [10888, 11118, ...]` keyed by integer `id`. Strapi 5 reissues `id` on each publish; `documentId` is the stable key. 4 of the 6 products had been republished and lost their integer ids.

**Fix:** Refactored to `SPECIALTY_PRODUCT_HANDLES` (string[]). Now stable across any publish action.

**Lesson → rule:** Never key code references to Strapi entries by integer `id`. Codified in `~/.claude/rules/strapi-admin-edit.md` § Integer `id`. See [[06-critical-traps]] § ST-2.

---

## [2026-05-13] CRON_SECRET rotate — Vercel build failed on trailing-newline whitespace

**Symptom:** Pushed a freshly rotated `CRON_SECRET` via `openssl rand -hex 32 | vercel env add CRON_SECRET production`. Next build failed with *"contains leading or trailing whitespace, which is not allowed in HTTP header values."*

**Reality:** `vercel env add` reads stdin verbatim including trailing `\n` from `openssl rand`. Verify via `vercel env pull` + length check; expected 64 chars for hex-32, got 65.

**Fix:** `printf "%s" "$(openssl rand -hex 32 | tr -d '\n\r')" | vercel env add CRON_SECRET production`.

**Lesson → rule:** `~/.claude/rules/vercel-env-cli-gotchas.md`. See [[06-critical-traps]] § V-3.

---

## [2026-05-12] our-mission text fix — `Body` overrides `Content` (legacy field trap)

**Symptom:** Updated Strapi `our-mission.Content[5]` to "Quality is the Promise. Kosher is the Standard." Three deploys later, production still rendered the old text. REST + GraphQL both returned the new value.

**Reality:** The entry had `Body` (dynamic-zone) entries. The renderer uses `StructuredInfoBody` (Body) when present and falls back to `StructuredInfoContent` (Content) otherwise. `Body[0].Body[0].children[0].text` was the actually-rendered field. Lost an hour before catching this.

**Fix:** Updated the correct `Body` path. The Content field still has the old text; it's now dead code.

**Lesson → rule:** Always check BOTH `Body` and `Content` on legal-page-style schemas before editing. Codified in `~/.claude/rules/strapi-admin-edit.md` § Body vs Content trap. See [[06-critical-traps]] § ST-3.

---

## [2026-05-12] our-mission text fix (cont.) — Data Cache held stale value for 3 deploys

**Symptom:** Same incident. After fixing the Body/Content issue, Strapi REST + GraphQL returned the new text. Production still rendered the old text on 3 subsequent deploys.

**Reality:** Vercel's Next.js Data Cache had snapshotted the old GraphQL response at first build. New builds did not flush it.

**Fix (immediate):** `cache: "no-store"` on the our-mission fetch as a brute-force bypass.
**Fix (long-term):** Tagged fetches + `revalidateTag('strapi')` on Strapi webhook, which had partly worked but had a misconfigured `REVALIDATE_SECRET` (re-keyed during the trailing-newline incident, see above).

**Lesson → rule:** Data Cache persists across deploys; new builds don't bust it. Codified in `~/.claude/rules/vercel-deploy-verify.md` § Data Cache. See [[06-critical-traps]] § V-2 and [[08-deploy-and-verify]] § Data Cache trap.

---

## [2026-05-12] Account routes — every `/us/account/*` page 500s in production

**Symptom:** Production `/us/account/*` returned 500 for every route except `/us/account/wishlist`. Build had been "Ready" all day. `/us/account/wishlist` worked because it was the only route NOT inside the parallel-route pattern.

**Reality:** Parallel routes (`@dashboard`, `@login`) nested inside the `[countryCode]` dynamic segment hit the Next.js manifest bug (vercel/next.js#76148). Stub manifests via `scripts/fix-parallel-route-manifests.js` silenced deploy-time errors but every page-level client component reachable through the shared layout 500'd at runtime with *"Could not find the module in the React Client Manifest."*

**Fix:** Refactor (commit `40d49dc`) away from parallel routes — `git mv @dashboard/<child>/page.tsx` → `<child>/page.tsx`, deleted `@login/`, `@dashboard/`, `default.tsx`. New top-level `page.tsx` branches on auth state. `scripts/fix-parallel-route-manifests.js` still in place defensively but reports `generated 0 manifest file(s)` after the refactor.

**Lesson → rule:** Parallel routes inside dynamic segments are deadly. Codified in `~/.claude/rules/nextjs-parallel-routes-bug.md`. See [[06-critical-traps]] § NX-1.

---

## [2026-05-08] getofek.com — every SSR route timed out at the edge with 0 bytes received (~2h outage)

**Symptom:** TLS completed, requests fully sent, function never invoked, 0 bytes returned. Static assets fine. `x-matched-path: /500` on every dynamic page. Build "Ready" on Vercel.

**Reality:** Two distinct dynamic-route slug collisions:
- `app/api/output-artifacts/[artifactId]/share/route.ts` vs `app/api/output-artifacts/[id]/regenerate/route.ts`
- `app/viewer/[rawDocumentId]/...` vs `app/viewer/[id]/...`

Build succeeded both times; routing table got silently corrupted at runtime.

**Fix:** Renamed colliding slugs to match siblings exactly. Fixed first collision restored API routes; fixed second collision restored SSR pages.

**Lesson → rule:** Match slug name to every sibling at the same dynamic-segment level. Codified in `~/.claude/rules/nextjs-dynamic-routes.md`. See [[06-critical-traps]] § NX-2. The audit script in that rule should be run before any commit that adds a new `[slug]/...`.

---

## [Pre-2026-05] Daily brief — sent with 0 positions and stale data (cross-project)

This is from the `gp-finance` repo (different project) but the lesson generalizes: validate before sending; reconcile before generating; never send a broken automation; alert on validation failure.

Codified in `~/.claude/rules/brief-quality.md`. The pattern applies to any storefront-side automation that emails customers (back-in-stock triggers, order confirmations, etc.).

---

## Format for new entries

When you produce or discover a new incident worth recording:

1. Add a new `## [YYYY-MM-DD] <area> — <symptom>` entry at the **top** of this file (most-recent-first within the file body; the log.md is append-only, this is curated).
2. Three subsections: **Symptom**, **Reality** (root cause), **Fix**.
3. End with **Lesson → rule:** pointing to the global rule or this wiki page.
4. Append an `incident` entry to [log.md](./log.md): `## [YYYY-MM-DD] incident | <area>`.

If the incident reveals a NEW trap class:
- Add a new `~/.claude/rules/<name>.md`
- Add a trap entry to [[06-critical-traps]]
- Cross-reference both from this page

## Next reads

- [[06-critical-traps]] — the curated traps these incidents produced
- [[07-shipping-an-issue]] — the validation gate that closes the gap
- [[08-deploy-and-verify]] — the post-push protocol

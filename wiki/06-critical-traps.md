# 06 — Critical Traps

Production-breaking gotchas. **Each one of these has taken down or silently corrupted production at least once.** Read all of them before any non-trivial change.

Each trap below is a one-paragraph summary. The full diagnostic + fix lives in the linked global rule. **DO NOT** copy diagnostic content here — keep it in one place.

---

## Next.js

### NX-1. Parallel-route manifest bug ([vercel/next.js#76148](https://github.com/vercel/next.js/issues/76148))

**Symptom:** A parallel route (`@slot/page.tsx`) nested inside a dynamic segment (`[countryCode]/account/@dashboard/...`) builds green. Vercel marks the deploy "Ready." Every route under that subtree 500s at runtime with `Could not find the module "<path>" in the React Client Manifest`. The `next build` output shows affected routes as `0 B First Load JS`.

**Quick check:** `next build 2>&1 | grep -E "/[a-z].*0 B "` — any hits = broken parallel slot.

**Fix:** Refactor away from parallel routes inside the dynamic segment to a single `page.tsx` with conditional rendering. Stub manifests (the `scripts/fix-parallel-route-manifests.js` defensive patch) silence deploy-time errors but DO NOT fix runtime. **The May 2026 account refactor (commit `40d49dc`) removed the last instance of this pattern in our app.**

**Full diagnostic:** `~/.claude/rules/nextjs-parallel-routes-bug.md`.

### NX-2. Dynamic slug collisions (silent route table corruption)

**Symptom:** Two siblings at the same path level with different slug names (e.g. `app/api/output-artifacts/[artifactId]/...` and `app/api/output-artifacts/[id]/...`). Build succeeds, Vercel marks deploy "Ready," but at runtime EVERY SSR request to the project times out at the edge with 0 bytes received. Static assets keep serving from cache, masking it.

**Quick check:** Before any commit that adds a new `[slug]/...`:

```bash
find src/app -name '[*]' -type d -print0 | xargs -0 -I{} dirname {} | sort -u | while read parent; do
  slugs=$(find "$parent" -maxdepth 1 -name '[*]' -type d -printf '%f\n' | sort -u)
  count=$(echo "$slugs" | wc -l | tr -d ' ')
  [ "$count" -gt 1 ] && echo "COLLISION in $parent:" && echo "$slugs" | sed 's/^/  /'
done
```

**Fix:** Match the slug name exactly to existing siblings. Alias locally in the handler if the domain language differs.

**Full diagnostic:** `~/.claude/rules/nextjs-dynamic-routes.md`. **Outage instance: 2026-05-08 getofek.com, ~2h.**

---

## Strapi

### ST-1. The `data:` wrapper trap (silent field drop)

**Symptom:** A `PUT /content-manager/.../<documentId>` with `{"data": {"FieldName": value}}` returns 200 OK. The response body even echoes the field name. But subsequent reads show the field as `null`. No error, no warning. Strapi 5's content-manager API uses an entry-shape-at-top-level contract, NOT the public REST `data:` wrapper.

**Quick rule:**
- Public REST (`/api/<collection>`) → uses `{ "data": { ... } }` wrapper.
- Admin content-manager (`/content-manager/...`) → NO wrapper. Top-level fields.

**Fix:** Strip the wrapper. For component sub-fields, also include the existing component `id` so Strapi updates in place. Verify the write landed via `GET …?status=draft`.

**Full diagnostic:** `~/.claude/rules/strapi-admin-edit.md` § THE `data:` WRAPPER TRAP. **Real cost: 2026-05-13 — a 761-entry populate ran for 12 min, "succeeded" with 0 reported failures, and none of the writes landed.**

### ST-2. Integer `id` is NOT stable across publishes

**Symptom:** A curated product list keyed by integer `id` (e.g. `SPECIALTY_PRODUCT_IDS = [10888, 11118, ...]`) silently drops products after a bulk republish. Strapi 5 assigns a new auto-increment `id` to each new published revision; only `documentId` is stable.

**Fix:** Refactor to key by `documentId` or domain identifier (`Handle`, `Slug`). Audit existing code with `grep -rn "_PRODUCT_IDS\b\|productIds\s*=\s*\[" src/`.

**Real instance:** May 2026 SpecialtyRow regression — 4 of 6 specialty products fell off the carousel after a partial republish. Fixed by switching to `SPECIALTY_PRODUCT_HANDLES`.

**Full diagnostic:** `~/.claude/rules/strapi-admin-edit.md` § Integer `id`.

### ST-3. Body vs Content trap

**Symptom:** Updating a `Content` rich-text field on a `legal-page`-style entry. REST returns the new value. Production keeps rendering the old text.

**Cause:** Some schemas have BOTH `Body` (dynamic-zone: `info.section`, `info.image-block`, …) AND `Content` (legacy rich-text array). If the entry has any `Body` entries, `Body` wins; `Content` is ignored by the renderer.

**Fix:** Always check both fields before editing. Update `Body[N].children[M].text` for the dynamic-zone path.

**Full diagnostic:** `~/.claude/rules/strapi-admin-edit.md` § Body vs Content trap. **Real instance: 2026-05-12 "Quality is the Promise" text fix — lost an hour editing `Content[5]` before noticing the actual rendered text was in `Body[0].Body[0].children[0]`.**

---

## Vercel

### V-1. Deploy verify — wait, match, diagnose

**Trap:** `vercel deploy` exits 0, GitHub shows green check, production looks fine. But the production alias is still pointing at the previous deploy, OR the Next.js Data Cache is serving stale content from the previous deploy.

**Protocol:**
1. Wait for `gh api repos/<org>/<repo>/commits/$SHA/status` to show `success`.
2. Match the `dpl_…` ID inside the rendered HTML to your commit's deploy ID (`gh api .../deployments`).
3. Diff cache headers if something looks stale — `x-vercel-cache: MISS` ≠ "fresh data" (only means CDN edge missed).

**Full diagnostic + scripts:** `~/.claude/rules/vercel-deploy-verify.md`. See also [[08-deploy-and-verify]].

### V-2. The Next.js Data Cache persists across deploys

**Symptom:** REST/GraphQL upstream returns new data. Page render keeps showing old data through MULTIPLE deploys. No cache header explains it.

**Cause:** Vercel's Next.js Data Cache snapshots fetch responses at first build. A new build does NOT flush it.

**Fixes (in order of preference):**
1. Tagged fetches + `revalidateTag` from a webhook or server action.
2. `revalidatePath("/path")` for one-off path bust.
3. `cache: "no-store"` — brute-force, last resort.
4. **Don't push an empty commit thinking it will flush the cache. It won't.**

**Real instance:** 2026-05-12 our-mission text fix — Strapi REST + GraphQL both returned the new text; production kept showing old text through 3 deploys. Needed `revalidateTag`.

### V-3. `vercel env add` trailing-newline silent corruption

**Symptom:** Pushed `CRON_SECRET` via `openssl rand -hex 32 | vercel env add CRON_SECRET production`. Build fails with `Error: The CRON_SECRET environment variable contains leading or trailing whitespace, which is not allowed in HTTP header values.`

**Cause:** `vercel env add` reads stdin verbatim including trailing `\n`. Common offenders: `openssl rand`, `cat`, `echo "$VAL"`.

**Fix:** Strip whitespace before piping: `printf "%s" "$(openssl rand -hex 32 | tr -d '\n\r ')" | vercel env add VAR production`.

**Verify after adding:**
```bash
vercel env pull /tmp/env-check --environment=production
grep "^VAR=" /tmp/env-check | awk -F= '{print length($2)}'   # expect exact length
rm /tmp/env-check
```

**Full diagnostic:** `~/.claude/rules/vercel-env-cli-gotchas.md`. See [[08-deploy-and-verify]] § Env vars.

### V-4. Env-var-set ≠ deploy-running

**Trap:** Adding an env var does NOT trigger a rebuild. Production builds bake the env in. After `vercel env add`, push an empty commit OR run `vercel --prod` to trigger fresh build, OR new value won't be live in already-running functions.

---

## The shared abstraction trap (meta)

**Trap:** A "fix" to a shared helper (price resolver, kashruth badges, product card) passes a clean Codex review on the diff and the issue is closed. Days later the same regression class reappears on a different surface.

**Why:** Codex sees what was changed; it doesn't automatically find every callsite of the helper that **should have been** changed too. One Codex pass on a shared-abstraction change is insufficient.

**Fix:** Two-pass review. First pass on the diff. **Second pass** with an explicit "find every consumer" prompt: *"Audit every file that imports `<helper>` and confirm it routes through the resolver correctly. Look for surfaces that bypass the helper and reproduce the regression class manually."*

**Full protocol:** `~/.claude/rules/ship-an-issue-validation-gate.md` § One adversarial review isn't enough. **Real instance:** May 2026 `#104/#31` pricing fix — first pass clean, second pass found 4 bypass sites.

---

## Mobile screenshot tooling

### M-1. Chrome MCP `resize_window(375)` lies

**Symptom:** You set the viewport to 375px to verify a mobile bug. `window.innerWidth` reads 500–606 (or in one bug, 2390). The screenshot shows a layout that doesn't match what a real iPhone customer sees.

**Cause:** Chrome MCP's `resize_window` resizes the OS window, not the rendering viewport, AND the extension's content-script overlay can swallow viewport changes.

**Fix:** Use shell-launched headless Chrome with explicit `--window-size=375,812` for strict 375px audits. See `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/headless-chrome-mobile-screenshots.md` for the exact command.

---

## Codex CLI failure modes

### CX-1. Codex CLI hung silently for 20+ min

**Symptom:** Codex CLI started, transcript file size growing, then size stops growing for 20+ minutes. No VERDICT line. The wrapper agent reports "completed" but no files were produced.

**Fix:** Fall back to the `code-simplifier` agent for single-file adversarial reviews (~30s vs Codex's 20+ min). See `~/.claude/rules/codex-pair-programming-fallbacks.md` § The silent timeout.

### CX-2. Codex sandbox-write-block

**Symptom:** Codex returns *"writes to `/Users/<user>/coding/<repo>` are not permitted in this session."*

**Cause:** Codex CLI sandbox restricts writes to the cwd + `/tmp` + its own temp paths. Cross-repo writes fail.

**Fix:** Run Codex from the target repo's cwd, OR instruct Codex to write to `/tmp/<name>.ext` and move the file yourself, OR implement manually.

---

## Cross-cutting

Every trap in this page has a one-line tag in [[10-recent-incidents]] anchored to the outage that taught it. Read both pages.

When you discover a NEW trap that fits the load-bearing-production-breaker class:
1. Add a global rule file at `~/.claude/rules/<descriptive-name>.md`.
2. Add a one-paragraph entry to this page linking to the rule.
3. Append an `incident` entry to [log.md](./log.md).

## Next reads

- [[10-recent-incidents]] — the timeline that produced these rules
- [[07-shipping-an-issue]] — the validation gate that catches them BEFORE prod
- [[08-deploy-and-verify]] — the deploy diagnostic flow

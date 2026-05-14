# 08 — Deploy and Verify

What happens after `git push origin main`, and how to know it actually worked.

## The deploy flow

```
git push main
   ↓
GitHub commit status: pending → Vercel detects → Vercel build runs
   ↓
yarn build + postbuild (next-sitemap + scripts/fix-parallel-route-manifests.js)
   ↓
GitHub commit status: success
   ↓
Vercel auto-promotes new deploy to production alias
   ↓
Production now serves the new dpl_…
```

Total time: typically 2–4 min.

## Step 1: Wait for build success

```bash
SHA=$(git rev-parse HEAD)
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 10
  STATE=$(gh api "repos/aviswerdlow/grillers-medusa-frontend/commits/$SHA/status" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(next((s['state'] for s in d.get('statuses',[]) if 'Vercel' in s.get('context','')), '?'))")
  echo "  $((i*10))s: $STATE"
  [ "$STATE" = "success" ] && break
  [ "$STATE" = "failure" ] && echo "BUILD FAILED" && break
done
```

**Empty or pending** → keep waiting. **Failure** → fetch logs (`gh api repos/.../commits/$SHA/check-runs`), don't retry blindly.

## Step 2: Match the deploy ID

`x-vercel-cache: MISS` + a recent `last-modified` only tells you the CDN edge cache missed. Says NOTHING about which deploy is actually serving. Match the `dpl_…` ID in the rendered HTML:

```bash
curl -s -L -c /tmp/jar -b /tmp/jar https://grillers-medusa-frontend.vercel.app/us/store > /tmp/p.html
grep -oE "dpl_[A-Za-z0-9]+" /tmp/p.html | sort -u | head -1
```

Cross-check against:

```bash
gh api repos/aviswerdlow/grillers-medusa-frontend/deployments | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['url'])"
```

If `dpl_…` is older than your push, the alias hasn't promoted yet (give it 30–60s). If it's still old after 2 min, suspect auto-promote is disabled or the deploy failed silently.

## Step 3: Verify the rendered output

The "minimum smoke test" depends on what you changed:

| Change scope | Smoke test |
|---|---|
| Homepage section | Load `/us` at 1440px AND 375px, scroll the affected section, check console for errors |
| PLP | Load `/us/collections/<slug>` at both viewports, check both grid AND list view |
| PDP | Load a representative product, check price renders correctly (see [[05-pricing-and-catch-weight]]) |
| Cart | Add → view → modify → remove a line; check totals |
| Checkout | **Chris's lane — don't touch without explicit handoff** |
| Footer info page | Load `/us/info/<slug>` (or `/us/kashruth/<slug>`), check rendered text matches Strapi |
| Search | Type a query, check autocomplete + search results |
| API route | curl the route, check response shape |

## Cache header reference

| Header | What it tells you |
|---|---|
| `x-vercel-cache: MISS` | CDN edge cache missed. **Does NOT mean fresh data** — Data Cache may still be stale. |
| `x-vercel-cache: HIT` | Edge cached. Bypass with `?nc=$(date +%s)` query param. |
| `last-modified` | When the cached response was generated. |
| `age` | Seconds since generated. |
| `x-matched-path: /500` | Next.js prerendered a 500 at build time — route is broken, not slow. |
| `x-next-error-status: <N>` | SSR returned a non-200. |

## The Data Cache trap (and how to fix it)

**Trap:** REST/GraphQL upstream returns the new value. The deploy is current (`dpl_…` matches). Production STILL renders the old value through multiple deploys.

**Why:** Vercel's Next.js Data Cache snapshots fetches at first build. New builds do NOT flush it.

**Fixes, in preference order:**

1. **Tagged fetches + `revalidateTag` from webhook:**
   ```ts
   const data = await request(endpoint, QUERY, vars, headers, {
     next: { tags: ["strapi"], revalidate: false },
   })
   ```
   Then on a Strapi entry publish:
   ```bash
   curl -X POST https://grillers-medusa-frontend.vercel.app/api/revalidate \
     -H "Authorization: Bearer $REVALIDATE_SECRET"
   # → {revalidated: true, tag: "strapi", ...}
   ```

2. **`revalidatePath("/path")` from a server action** — one-off path bust.

3. **`cache: "no-store"`** — brute-force; only as last-resort fallback when revalidation isn't wired yet.

4. **Don't push an empty commit to flush the cache.** It won't.

## Revalidation smoke test

After a Strapi publish (or to verify the revalidation hookup works):

```bash
# GET — smoke: secret is configured
curl https://grillers-medusa-frontend.vercel.app/api/revalidate
# expect: {"secretConfigured": true}

# POST — actually bust the cache
curl -X POST https://grillers-medusa-frontend.vercel.app/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
# expect: {"revalidated": true, "tag": "strapi", ...}
```

If POST returns 401, the secret in Vercel `REVALIDATE_SECRET` env var doesn't match Strapi's webhook `Authorization` header. Fix one or the other — see [[06-critical-traps]] § V-3 for the trailing-newline trap if you've just rotated the secret.

## Env vars

Adding a new env var via `vercel env add` does NOT trigger a rebuild. Either:
1. Push an empty commit (`git commit --allow-empty -m "trigger rebuild"`) — yes, this DOES trigger a build even though it doesn't bust the Data Cache.
2. Run `vercel --prod` from the project directory.

**Verify the new value is live:**

```bash
vercel env pull /tmp/env-check --environment=production
grep "^VAR_NAME=" /tmp/env-check | awk -F= '{print length($2)}'
# expected: known length (e.g. 64 for hex-32). Off-by-one = trailing newline.
rm /tmp/env-check
```

Full trailing-newline diagnostic: `~/.claude/rules/vercel-env-cli-gotchas.md`.

## Rollback

If production is broken and the fix isn't obvious within ~10 min, **roll back first, then investigate**:

```bash
# list recent deploys
vercel ls --prod aviswerdlow/grillers-medusa-frontend

# promote a known-good deploy back to production
vercel promote <last-good-deploy-url>
```

Don't try to fix forward in production. Restore service, then take your time to find the real cause.

## When to bisect deploys

For "Vercel hangs everything" or "every route 500s" symptoms (typically [[06-critical-traps]] § NX-1 or NX-2):

```bash
# list every deploy by age
vercel ls --prod aviswerdlow/grillers-medusa-frontend

# test a simple SSR route on each deploy URL directly:
for url in <deploy-urls>; do
  curl -m 6 "https://$url/us" -o /dev/null -w "%{http_code} $url\n"
done
```

The boundary between "200 fast" and "0 bytes timeout" is the breaking deploy. Diff that commit. See [[06-critical-traps]] § NX-2 for the rest of the protocol.

## Full reference

`~/.claude/rules/vercel-deploy-verify.md` is the source-of-truth rule. **This wiki page summarizes; the rule is canonical.**

## Next reads

- [[06-critical-traps]] — what to suspect when verification fails
- [[09-testing]] — Jest, Playwright, mobile screenshots
- [[10-recent-incidents]] — outages this protocol would have caught earlier

# 14 — Services and Access

URLs, credentials pointers, and access protocols for every system the storefront depends on.

**This page contains NO secrets.** Credentials live in project memory at `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/`. This page tells you where each pointer file is.

## Production URLs

| System | URL | Source-of-truth memory |
|---|---|---|
| **Storefront (prod)** | `https://grillers-medusa-frontend.vercel.app/us` | `prod-url.md` |
| **Medusa admin** | (see memory — Railway URL) | `medusa-admin-url.md` |
| **Strapi admin** | (see memory) | `strapi-admin-credentials.md` |
| **Algolia dashboard** | `https://dashboard.algolia.com` | — (login via Avi's Anthropic SSO) |
| **Stripe dashboard** | `https://dashboard.stripe.com` | — (Chris's lane; ask Chris for access) |
| **Postmark** | `https://account.postmarkapp.com` | `postmark-credentials.md` |
| **Vercel** | `https://vercel.com/aviswerdlow` | — (Avi has org access; Chris has prod env access) |
| **GitHub repo (storefront)** | `https://github.com/aviswerdlow/grillers-medusa-frontend` | — |
| **GitHub issues (everything)** | `https://github.com/aviswerdlow/grillers-pride-strategy` | — |
| **Railway dashboard** | (see Chris) | — |

**Don't confuse domains.** `getgrillerspride.com` is a separate legacy/redirect host. `getofek.com` is a different project entirely. The storefront is always `grillers-medusa-frontend.vercel.app/us` (the `/us` country prefix is required).

## Credentials (NEVER commit, NEVER paste in public issue bodies)

All credential files in `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/`:

- `medusa-admin-credentials.md` — Medusa V2 admin login
- `strapi-admin-credentials.md` — Strapi admin login (used for JWT generation in scripts)
- `postmark-credentials.md` — Postmark account access

Other secrets that ARE NOT in memory (intentionally):

- **Fal.ai API key** — in `/Users/aviswerdlow/coding/product-merch/.env` as `FAL_KEY`. Used for image generation; can be rotated freely if needed.
- **`REVALIDATE_SECRET`** — Vercel env var. Matches the Strapi webhook `Authorization` header. Rotation: see [[06-critical-traps]] § V-3 (trailing-newline trap).
- **Strapi `STRAPI_API_TOKEN`** — Vercel env var. Read-only. Storefront uses for GraphQL reads.
- **Stripe live mode keys** — Chris's lane; do not handle.
- **`MEDUSA_PUBLISHABLE_KEY`** — Vercel env var. Public; safe to log.

## Service-specific access protocols

### Medusa V2 (admin)

**Read access:** Anyone with admin login can browse products, orders, customers.

**Write access:** Should usually go through Medusa admin UI by a human (Chris or Peter). Programmatic writes via Medusa SDK from the storefront ONLY for customer-facing actions (cart, customer, order placement). Backfills and bulk operations are Chris's lane.

**Webhooks:** Medusa fires webhooks to Postmark (order confirmation, etc.) and to the storefront (back-in-stock triggers — `src/lib/data/back-in-stock-trigger.ts`). Webhook secrets are stored in Medusa admin env vars (Chris).

### Strapi Cloud

**Read access via API:** Token in Vercel env `STRAPI_API_TOKEN`. Read-only. The storefront uses this for GraphQL reads.

**Write access via API:** Requires admin login (`/admin/login` with email+password) returning a session JWT (TTL ~30 min). See `~/.claude/rules/strapi-admin-edit.md` for the full protocol.

**Schema changes:** Push to the Strapi-connected GitHub branch → Strapi Cloud deploys schema in ~3 min. NOTE: `patch-package` patches don't always apply on Strapi Cloud's build — see `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-cloud-deploy-quirks.md`.

**Publishing:** Drafts don't surface to the storefront. After any write, call `POST .../actions/publish`. Verify via `GET …?status=draft` to confirm the write landed before publishing.

### Algolia

**Read (search):** Public search key in Vercel env `ALGOLIA_SEARCH_API_KEY`. Safe to expose to clients.

**Write (indexing):** Done by the `strapi-algolia` plugin on Strapi publish webhook. No direct programmatic indexing from the storefront. If Algolia is out of sync with Strapi, republish the affected Strapi entries.

**Debugging missing products:**
1. Verify the product is PUBLISHED in Strapi (not just draft).
2. Republish the entry — sync fires on publish.
3. Wait ~30s, retest.
4. If still missing, check Algolia dashboard for the `products` index → search for the product handle directly to confirm absence.

### Stripe

**Test mode:** Avi can use test cards. Test secrets are in `.env.local` for dev (not committed).

**Live mode:** Chris only. Live keys live in Vercel production env. Don't touch.

### Postmark

**Templates** live in the Postmark UI. Chris owns. The storefront only emits send-tokens; templates render on Postmark's side.

**Sender domain:** Must be DKIM-verified. If a customer reports an email not delivered, check the Postmark dashboard for bounce / spam-complaint logs first.

### Vercel

**Project:** `grillers-medusa-frontend` under the `aviswerdlow` org.

**Env vars:**
- Avi can rotate: `STRAPI_API_TOKEN`, `ALGOLIA_SEARCH_API_KEY`, `REVALIDATE_SECRET`, dev-mode keys.
- Chris owns: `NEXT_PUBLIC_STRIPE_KEY` (live), all production Medusa secrets that aren't published.

**Always strip trailing newlines** when adding env vars via CLI — see [[06-critical-traps]] § V-3.

**Auto-promote** is enabled — every successful `main` build promotes to production alias. If it's disabled, ask Chris before re-enabling.

### Railway (Medusa hosting)

**Access:** Chris only. If a Medusa endpoint is misbehaving, file an issue with the symptom + a curl repro and tag for Chris. Don't try to debug Medusa-side from the storefront.

## DNS / domain routing

The custom domain (`getgrillerspride.com` and any others) is managed by Chris. The `grillers-medusa-frontend.vercel.app` URL is the canonical name we use for testing; production customers eventually hit the custom domain.

If a redirect is broken or a custom domain misbehaves, file the issue and tag for Chris.

## Where to find a credential during a session

Common pattern: an agent needs the Strapi admin password to run a script.

```bash
# correct path:
cat ~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-admin-credentials.md

# NEVER hardcode it in a committed file, NEVER paste it in a chat the user can share.
```

If a credential isn't in memory and an agent needs it, ASK the user, don't guess.

## Recovery: a credential leaked

If a secret leaks (committed to a public repo, posted in a public issue, etc.):

1. Rotate immediately on the service (Strapi → regen token; Vercel → `vercel env rm` + add new; Fal.ai → regen via dashboard).
2. Update memory file + Vercel env to the new value.
3. Force-push to scrub git history if it's in a commit. `git filter-repo` is the right tool; `git filter-branch` is deprecated.
4. Tell the human owner of that service (Chris for Stripe/Postmark, Peter for product credentials, Avi for everything else).
5. Note the incident in [log.md](./log.md) and update the relevant memory.

## Next reads

- [[06-critical-traps]] § Vercel env CLI for env var gotchas
- [[12-people-and-lanes]] — who owns access to what
- `~/.claude/rules/strapi-admin-edit.md` — the canonical Strapi-write protocol

# 03 — Getting Started (Agent Quickstart)

A 10-minute orientation. If you've never touched this repo before, read this end-to-end. If you've been away ≥1 week, skim it for changes.

## 1. Verify the environment

```bash
cd /Users/aviswerdlow/coding/grillers-medusa-frontend
node --version                 # expect 18+ (Node 24 LTS works)
yarn --version                 # repo uses Yarn (look for yarn.lock — if missing, ask)
cat package.json | grep '"name"'   # → "medusa-next"
```

Required env vars (set in `.env.local` for dev, in Vercel dashboard for prod):

| Var | What | Where to look if missing |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Medusa API key | Medusa admin → Settings → API Keys |
| `MEDUSA_BACKEND_URL` | Railway Medusa URL | `medusa-admin-url.md` (memory) |
| `STRAPI_ENDPOINT` | Strapi Cloud URL | Strapi admin → Settings |
| `STRAPI_API_TOKEN` | Read-only Strapi token | Strapi admin → Settings → API Tokens |
| `ALGOLIA_APPLICATION_ID`, `ALGOLIA_SEARCH_API_KEY` | Algolia | Algolia dashboard |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable | Stripe dashboard |
| `REVALIDATE_SECRET` | Webhook secret for Strapi → Next.js | matches Strapi webhook `Authorization` header |

`check-env-variables.js` enforces `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` at build time — if it's missing the build fails fast with a helpful error.

## 2. Start the dev server

```bash
yarn install     # only if node_modules is missing or stale
yarn dev         # → http://localhost:8000 (NOT 3000; Turbopack)
```

Storefront lives at `http://localhost:8000/us/...` — note the country code prefix. `/` redirects to `/us/`.

## 3. The 5-file orientation tour

Read these in order. ~20 minutes total. After this you understand 80% of how the storefront works.

1. **`src/middleware.ts`** — How country code gets into the URL. Cannot use the SDK (Edge Runtime).
2. **`src/lib/config.ts`** — The Medusa SDK singleton. Every other module imports `sdk` from here.
3. **`src/lib/data/products.ts`** — How products are fetched (server action pattern). Open one server action and trace its callers — you'll see the data flow shape repeated everywhere.
4. **`src/modules/products/templates/index.tsx`** — The PDP page template. Composes 10+ components: product detail, kashruth badges, related products, etc. Read top-down to see how `src/app/[countryCode]/(main)/products/[handle]/page.tsx` flows data into modules.
5. **`src/modules/collections/components/strapi-product-grid.tsx`** — The PLP grid/list card. The single component rendered most often by any customer journey. Has both grid and list view branches. **This file is involved in multiple recent bugs** — see [[10-recent-incidents]].

## 4. Find what you're looking for

| You need to change… | Look in |
|---|---|
| Homepage section order or content | `src/modules/home/components/*` (each section is one folder); content from Strapi via `src/lib/data/strapi/home.ts` |
| PLP card layout (grid OR list) | `src/modules/collections/components/strapi-product-grid.tsx` |
| PDP layout | `src/modules/products/templates/index.tsx` + `src/modules/products/components/product-detail/*` |
| Price rendering anywhere | `src/lib/util/price-display.ts` (the resolver) — see [[05-pricing-and-catch-weight]] |
| Add-to-cart button | `src/modules/products/components/product-detail/components/product-actions/index.tsx` (PDP), `src/modules/collections/components/strapi-product-grid.tsx` (PLP cards) |
| Cart drawer | `src/modules/layout/components/cart-button/` and `src/modules/cart/` |
| Checkout step | `src/modules/checkout/templates/` (DO NOT TOUCH WITHOUT CHRIS'S OK — checkout is his lane) |
| Footer / nav | `src/modules/layout/components/footer/`, `src/modules/layout/components/header/` |
| Recipes | `src/modules/recipes/` |
| Account dashboard | `src/modules/account/` (refactored from parallel routes in May 2026 — see `~/.claude/rules/nextjs-parallel-routes-bug.md`) |

## 5. Before you change anything

These ABSOLUTE prerequisites apply to every edit:

1. **Read [[06-critical-traps]]** — 5 minutes. Each one of these has historically broken production. They're load-bearing.
2. **Confirm you're in the right lane** — see [[12-people-and-lanes]]. Checkout, Postmark, Stripe live mode → Chris. Per-lb pricing decisions, PDP copy, bundle composition → Peter. Everything else → you/Avi.
3. **For shared abstractions** (price resolver, kashruth badges, product card, layout chrome): **plan to run Codex review TWICE** — once on the diff, once with a "find every consumer" prompt. The first pass misses bypass sites. See `~/.claude/rules/ship-an-issue-validation-gate.md`.

## 6. How to verify a change

The minimum bar for "done" (per the ship-an-issue validation gate):

1. ✅ `yarn lint` clean (ignored at build but you should still see 0 errors)
2. ✅ `yarn build` succeeds locally (catches more than `yarn dev`)
3. ✅ Visual verification at **1440px AND 375px** (mobile parity is non-negotiable)
4. ✅ Codex review on the diff (`/codex:review`) — mandatory for: shared abstractions, auth, checkout, anything with PII or financial impact
5. ✅ Push, wait for build success (`gh api repos/aviswerdlow/grillers-medusa-frontend/commits/$SHA/status`), then verify the production `dpl_…` ID in rendered HTML matches your commit. See [[08-deploy-and-verify]].
6. ✅ Issue close comment per template in [[07-shipping-an-issue]]

## 7. When something goes weird

| Symptom | Where to start |
|---|---|
| Build green, prod 500 on a route | [[06-critical-traps]] § Next.js parallel routes OR slug collisions |
| Strapi PUT returned 200 but field is still null | [[06-critical-traps]] § Strapi — the `data:` wrapper trap |
| Vercel env var "contains leading or trailing whitespace" | [[06-critical-traps]] § Vercel CLI |
| Content updated in Strapi but production still shows old text | [[06-critical-traps]] § Vercel Data Cache, or [[08-deploy-and-verify]] |
| Algolia missing a product that's published in Strapi | Republish the entry in Strapi (auto-increment id changes invalidate Algolia entries) — see `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/strapi-cloud-deploy-quirks.md` for variant |
| Chrome MCP `resize_window(375)` shows actual width 500-606 | Use shell-launched headless Chrome — see `~/.claude/projects/-Users-aviswerdlow-coding-grillerspride/memory/headless-chrome-mobile-screenshots.md` |
| `pricing` looks like `$5.99/lb` but the product is fixed-price | The PricingMode resolver — see [[05-pricing-and-catch-weight]]. The fix is "use the resolver, not local logic." |
| Codex CLI hung for 20+ min | Fall back to `code-simplifier` for single-file review — see `~/.claude/rules/codex-pair-programming-fallbacks.md` |

## 8. Never do this without explicit permission

- Modify anything under `src/modules/checkout/`
- Touch `src/lib/data/payment.ts` or any Stripe-related code
- Change Postmark templates (those live in Medusa admin, but if you find a config in this repo, Chris owns it)
- Push to `main` without verification (see [[07-shipping-an-issue]])
- Run `vercel env add` on a production env var without confirming with the user first
- Delete files under `analysis/` in the strategy repo (different repo — but agents wander)
- `git add -A` or `git add .` (cardinal rule from `AGENTS.md`)

## Next reads

- [[04-data-patterns]] — server actions, Strapi GraphQL, Medusa SDK
- [[05-pricing-and-catch-weight]] — the pricing resolver pattern
- [[06-critical-traps]] — read before any non-trivial change
- [[14-services-and-access]] — URLs and access protocol for every dependency

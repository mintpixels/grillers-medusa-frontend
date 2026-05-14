# 01 — Architecture

A system map for agents new to the Grillers Pride storefront. Read this **before** touching any code.

## The 30-second model

```
                  ┌────────────────────┐
                  │   Strapi Cloud     │   product copy, recipes, footer pages, SEO, PDP
                  │   (CMS)            │   "Anything a marketer would edit"
                  └─────────┬──────────┘
                            │ GraphQL (read) + admin REST (write via JWT)
                            ▼
┌─────────────┐    ┌────────────────────┐    ┌──────────────────┐
│   Algolia   │◀──▶│  Next.js 15.5      │◀──▶│   Medusa V2      │  product catalog, cart,
│   (search)  │    │  storefront        │    │   (Railway)      │  checkout, customer,
└─────────────┘    │  (Vercel)          │    └──────────────────┘  orders, regions, prices
                   │                    │
                   └──────────┬─────────┘
                              │
                ┌─────────────┼──────────────┐
                ▼             ▼              ▼
            ┌───────┐    ┌────────┐    ┌──────────┐
            │ Stripe│    │Postmark│    │ Vercel   │
            │(pay)  │    │(email) │    │ KV/Blob  │
            └───────┘    └────────┘    └──────────┘
```

## Each system, plain English

**Next.js 15.5 storefront** (this repo) — App Router, server actions for all data access, Tailwind + custom brand fonts, hosted on Vercel. Every storefront route is nested under `[countryCode]` (e.g. `/us/...`). The middleware (`src/middleware.ts`) detects country from URL → Vercel header → env default.

**Medusa V2 backend** (`grillers-medusa-admin` repo, hosted on Railway) — the system of record for the catalog, cart, checkout, customer accounts, orders, regions, shipping options. The storefront talks to Medusa via the SDK singleton at `src/lib/config.ts` (`import { sdk } from "@lib/config"`). **Middleware cannot use the SDK** (Edge Runtime) — it uses raw `fetch` instead.

**Strapi Cloud** — enriched content: product copy beyond what Medusa stores, recipes, the homepage, all footer/info pages, SEO config, PDP-level enrichment, header/footer chrome, testimonials, announcements. The storefront reads Strapi via GraphQL (read-only token, env `STRAPI_API_TOKEN`). Writes go through the admin REST API with a session JWT — see [[06-critical-traps]] § Strapi for the `data:` wrapper trap.

**Algolia** — product search and faceted PLP filtering. Index is populated by the `strapi-algolia` plugin on Strapi entry publishes. When a product looks "missing" from search, suspect either (a) Strapi hasn't published the entry (publish state, not just draft), or (b) Algolia index is stale → trigger a republish from Strapi admin.

**Stripe** — payment processing. Multiple methods: credit card, iDeal, Bancontact, PayPal, manual. Helpers `isStripe()`, `isPaypal()`, `isManual()` live in `src/modules/checkout/components/payment/constants.tsx`. Live mode is **Chris's lane** — don't touch without explicit handoff.

**Postmark** — transactional email (order confirmations, shipping notifications, back-in-stock). Templates and sender domain are **Chris's lane**.

**Vercel** — deploys on every push to `main`. Production alias auto-promotes. Env vars via dashboard or `vercel env` CLI (watch out for the trailing-newline trap — see [[06-critical-traps]] § Vercel). The Next.js Data Cache persists ACROSS deployments — empty commits do NOT bust it.

## Data flow, by feature

| Feature | Reads from | Writes to | Cache strategy |
|---|---|---|---|
| Home page | Strapi (GraphQL) | — | force-cache, tag `strapi`, `revalidateTag` via webhook |
| PLP | Strapi (collection metadata) + Algolia (products) | — | force-cache + tag |
| PDP | Strapi (PDP enrichment) + Medusa (price/variants) | — | force-cache + tag |
| Cart | Medusa | Medusa | cookies + `revalidateTag('carts')` |
| Checkout | Medusa + Stripe | Medusa + Stripe + Postmark | server actions, no cache |
| Customer / account | Medusa | Medusa | cookies + revalidate |
| Recipes | Strapi (with `RelatedProducts` relation) | — | force-cache + tag |
| Footer info pages | Strapi (dynamic-zone `Body` field) | — | force-cache + tag |
| Search | Algolia | — | server-side fetch via Algolia JS client |
| Newsletter signup | Medusa | Medusa | server action |

## Repo layout (this repo)

```
src/
├── app/
│   └── [countryCode]/
│       ├── (main)/        ← public storefront (store, collections, products, recipes, account, wishlist)
│       └── (checkout)/    ← checkout flow with separate layout
├── lib/
│   ├── config.ts          ← Medusa SDK singleton (import { sdk })
│   ├── data/              ← server actions, all marked "use server"
│   │   ├── cart.ts products.ts customer.ts orders.ts payment.ts
│   │   ├── fulfillment.ts regions.ts favorites.ts wishlist.ts
│   │   ├── newsletter.ts back-in-stock.ts holiday-deadlines.ts
│   │   ├── cookies.ts     ← cart id, auth headers, cache tag helpers
│   │   └── strapi/        ← 17 fetchers for collections, recipes, PDPs, SEO, etc.
│   ├── hooks/             ← React hooks (add-to-cart, in-view, form persistence, etc.)
│   ├── util/              ← price formatting, SEO, GTM, product helpers, address compare
│   └── context/           ← React contexts (modal, analytics, cookie consent, fulfillment edit)
├── modules/               ← feature modules, each with components/ and templates/
│   ├── home/              ← hero, shop-bestsellers, shop-collections, specialty-row,
│   │                        kosher-promise, blog-explore, testimonials, etc.
│   ├── products/          ← PDP — product-detail, kashruth-badges, related-products
│   ├── collections/       ← PLP — strapi-product-grid, collection-filters, etc.
│   ├── store/             ← /store page templates
│   ├── checkout/          ← multi-step checkout templates and components
│   ├── account/           ← logged-in dashboard, profile, orders, addresses
│   ├── cart/              ← cart drawer + page
│   ├── recipes/           ← /recipes and /recipes/[slug]
│   ├── layout/            ← nav, footer, mobile menu, banner
│   └── common/            ← shared primitives (LocalizedClientLink, ProductCardCarousel, etc.)
├── middleware.ts          ← country detection, NEVER uses the SDK (Edge Runtime)
├── styles/                ← global CSS, fonts (rexton, maison-neue, maison-neue-mono)
└── types/                 ← shared TS types

scripts/                   ← postbuild patchers (parallel-route manifest defender, etc.)
ref/                       ← reference docs (checkoutInterview.md, shipping CSVs, tax rates)
e2e/                       ← Playwright E2E tests
public/                    ← static assets
```

See [[02-repos]] for sibling repos (Medusa admin backend, strategy portal, product-merch).

## Build & deploy mental model

1. Push to `main` → Vercel detects → runs `yarn build` (which calls `next-sitemap` postbuild + `scripts/fix-parallel-route-manifests.js`).
2. Build success → auto-promote to production alias.
3. Strapi publish webhook → POST to `/api/revalidate` → `revalidateTag('strapi')` on Next.js side → fresh content on next request.
4. **The Next.js Data Cache persists across deploys.** A new build does NOT flush it. If a fetch result looks stale, suspect Data Cache before suspecting your code. See [[08-deploy-and-verify]] for the diagnostic flow.

## What's NOT here

- **Inventory management** — lives in Medusa admin (Chris) and QuickBooks Desktop (Peter). Storefront reads availability via Medusa.
- **Product image generation** — happens in `product-merch` repo via Fal.ai. See [[13-imagery-pipeline]].
- **Strategy / financial / decision docs** — live in `grillerspride` repo (the strategy portal). See [[02-repos]].

## Next reads

- [[02-repos]] — the other four repos and what they own
- [[03-getting-started]] — agent quickstart, the 5-file orientation tour
- [[04-data-patterns]] — server actions, GraphQL, Medusa SDK
- [[06-critical-traps]] — every known production-breaker

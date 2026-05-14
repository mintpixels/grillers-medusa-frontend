# 04 — Data Patterns

Three patterns drive nearly all data access. Learn them once and you can read the codebase end-to-end.

## Pattern 1: Server Actions for Medusa

Every file in `src/lib/data/*.ts` starts with `"use server"`. They're called from server components AND client components alike — the framework handles the boundary.

**Canonical shape:**

```ts
// src/lib/data/cart.ts
"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"

export const retrieveCart = async (cartId?: string) => {
  const id = cartId || (await getCartId())
  if (!id) return null

  return await sdk.store.cart
    .retrieve(id, {}, { ...(await getAuthHeaders()) })
    .then(({ cart }) => cart)
    .catch(() => null)
}
```

**Key conventions:**
- The SDK singleton is `sdk` from `@lib/config`. Never instantiate your own.
- Auth headers come from `getAuthHeaders()` in `cookies.ts` — handles JWT-from-cookie.
- Errors are returned as `null` (not thrown) for read paths. Write paths use the medusa-error util at `src/lib/util/medusa-error.ts`.
- After a mutation, call `revalidateTag(...)` to bust the relevant Next.js cache.

**Read paths use `force-cache` + cache tags:**

```ts
const { products } = await sdk.store.product
  .list(
    { /* params */ },
    {
      ...(await getAuthHeaders()),
      next: { tags: ["products", `regions-${cacheId}`] },
      cache: "force-cache",
    }
  )
```

The `next: { tags: [...] }` is what lets `revalidateTag("products")` invalidate this cache later.

## Pattern 2: Strapi GraphQL (reads)

The storefront reads Strapi via `graphql-request`. All fetchers live in `src/lib/data/strapi/*.ts` (17 files, one per content type or feature: `home.ts`, `collections.ts`, `recipes.ts`, `pdp.ts`, `header.ts`, `footer.ts`, `seo.ts`, `analytics.ts`, `testimonials.ts`, `announcements.ts`, `cookie-consent.ts`, `customer-service.ts`, etc.).

**Canonical shape:**

```ts
// src/lib/data/strapi/recipes.ts
import { request, gql } from "graphql-request"

const endpoint = `${process.env.STRAPI_ENDPOINT}/graphql`
const headers = { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }

const RECIPE_QUERY = gql`
  query Recipe($slug: String!) {
    recipes(filters: { Slug: { eq: $slug } }) {
      documentId
      Title
      Slug
      Image { url }
      Ingredients { Name Quantity }
      RelatedProducts { documentId Title FeaturedImage { url } }
    }
  }
`

export async function getRecipe(slug: string) {
  const data = await request<{ recipes: Recipe[] }>(endpoint, RECIPE_QUERY, { slug }, headers)
  return data.recipes[0] ?? null
}
```

**Key conventions:**
- **No `data:` wrapper on reads** — the public REST API uses it; GraphQL does NOT. (The `data:` wrapper trap is for WRITES via admin REST — see [[06-critical-traps]] § Strapi.)
- The token is read-only. Writes require an admin JWT (separate flow).
- Strapi v5 uses `documentId` (stable across revisions) and integer `id` (NOT stable — re-issued on each publish). **Always key by `documentId` or a domain identifier (e.g. `Handle`, `Slug`), never integer `id`.**
- Most Strapi reads are wrapped in `force-cache` + tag `strapi`, busted by the Strapi → Next.js webhook on entry publish.

## Pattern 3: Strapi admin REST (writes)

**Almost never done from the storefront.** Writes happen via:
1. Strapi admin UI (humans)
2. Ad-hoc Python/Node scripts launched from a shell (agents doing backfills)
3. Strapi Cloud deploy (schema changes)

If you DO need to write programmatically, follow the protocol in `~/.claude/rules/strapi-admin-edit.md`:

1. POST `/admin/login` with email/password → JWT (TTL ~30 min)
2. `PUT /content-manager/{collection-types|single-types}/api::<model>.<model>/<documentId>` — **with NO `data:` wrapper, entry shape at the top level**
3. `POST .../actions/publish` to publish (drafts don't surface to the storefront)

For component sub-fields, include the existing component `id` so Strapi updates in place. Validate by `GET …?status=draft` (the write lands in draft first).

## Pattern 4: Algolia for search

Algolia is read-only from the storefront. The index is populated by the `strapi-algolia` Strapi plugin on entry publish.

Storefront usage:

```ts
import { algoliasearch } from "algoliasearch"

const client = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID!,
  process.env.ALGOLIA_SEARCH_API_KEY!
)

const { hits } = await client.searchSingleIndex({
  indexName: "products",
  searchParams: { query: "brisket", filters: 'Status:"active"' },
})
```

When a product is "missing" from search:
1. Confirm it's PUBLISHED in Strapi (not just draft)
2. Trigger a republish — the `strapi-algolia` plugin syncs on publish webhook
3. Wait ~30s, retest

## Cache strategy in one paragraph

The storefront aggressively caches Strapi/Medusa reads with `force-cache` + `next: { tags: [...] }`. On a mutation OR an upstream webhook (Strapi publish), the corresponding tag is busted with `revalidateTag(...)`. **The Vercel Next.js Data Cache persists across deploys** — empty commits don't bust it. If a value still looks stale after a redeploy, suspect Data Cache and call `revalidateTag` from a server action OR use `cache: "no-store"` as a brute-force fallback. See [[08-deploy-and-verify]].

## Where context goes

| Need | File |
|---|---|
| Cart id, region cache id, JWT, auth headers | `src/lib/data/cookies.ts` |
| Currency-formatted price string | `src/lib/util/format-price.ts` (low-level) |
| **Resolved price display (per-lb vs fixed-price)** | `src/lib/util/price-display.ts` — see [[05-pricing-and-catch-weight]] |
| Country list / region map | `src/lib/data/regions.ts` |
| GTM analytics events | `src/lib/util/gtm.ts` (firePageView, fireAddToCart, etc.) |
| Image URL helpers (Strapi → Next.js Image) | `src/lib/util/strapi-image.ts` if it exists, otherwise inline in callers |

## Next reads

- [[05-pricing-and-catch-weight]] — the load-bearing pricing resolver
- [[06-critical-traps]] § Strapi — the data: wrapper trap (writes) and integer-id instability
- [[08-deploy-and-verify]] — caching + Data Cache

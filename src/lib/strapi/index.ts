import { GraphQLClient } from "graphql-request"
import { unstable_cache } from "next/cache"

// Strapi content is editor-managed and edits must reflect on the site
// immediately on publish. Every fetch is tagged "strapi"; a Strapi
// webhook POSTs to /api/revalidate on entry.publish / entry.update /
// entry.unpublish / media events, which calls revalidateTag("strapi")
// and busts every cached Strapi response. Between publishes, responses
// stay in the Data Cache and are reused across requests — one Strapi
// round-trip per published change instead of one per page render.
//
// Setup is in two places:
//   - Strapi admin → Settings → Webhooks → "Next.js cache revalidation"
//   - Vercel env var REVALIDATE_SECRET (must match the Authorization
//     header value the Strapi webhook is sending)
//
// If revalidation ever appears broken (publish doesn't propagate to
// the site), the fastest diagnostic is:
//   curl https://grillers-medusa-frontend.vercel.app/api/revalidate
// which returns { secretConfigured: true|false }. A POST with the
// matching secret should return 200 with { revalidated: true }.
// Every Strapi call is wall-clock bounded at the CLIENT level. During the
// 2026-07-07 outage (even /_health dead), unbounded layout-level fetches
// (cookie consent, nav) hung ~40s toward 504s on every page — blowing the
// 60s-per-page prerender budget across the whole app (/us, /store,
// /collections, even /_not-found via the root layout) and failing the
// BUILD twice. Per-call timeouts can't win that game; bounding the shared
// client covers every call-site, current and future. On timeout the
// request rejects fast and each surface's existing fail-open fallback
// takes over. Data Cache hits return instantly and are unaffected.
const STRAPI_FETCH_TIMEOUT_MS = Number(
  process.env.STRAPI_FETCH_TIMEOUT_MS || 10_000
)

const strapiClient = new GraphQLClient(
  `${process.env.STRAPI_ENDPOINT}/graphql`,
  {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    fetch: (url, init) => {
      const reqInit = (init as RequestInit) || {}
      return fetch(url as string, {
        ...reqInit,
        cache: reqInit.cache || "force-cache",
        // Preserve a caller-supplied signal if one ever appears; today no
        // call-site passes one, so the timeout signal is the bound.
        signal: reqInit.signal || AbortSignal.timeout(STRAPI_FETCH_TIMEOUT_MS),
        next: {
          ...((reqInit as RequestInit & { next?: Record<string, unknown> })
            ?.next || {}),
          tags: ["strapi"],
        },
      })
    },
  }
)

export default strapiClient

/**
 * Result-level cache for Strapi GraphQL reads. graphql-request sends
 * POSTs, and Next's Data Cache does not cache POST fetches — so before
 * this, EVERY render re-paid the full Strapi round trip. The curated-
 * collections query measures 8-11s at ~600KB against Strapi Cloud,
 * straddling the client's 10s abort bound: every cache-miss render was
 * a coin flip that paged ops (~200 alerts/12h on 2026-07-08).
 *
 * unstable_cache stores the RESULT keyed by (name + variables), tagged
 * "strapi" so the existing publish webhook (revalidateTag("strapi"))
 * still busts it instantly; the TTL is a safety net between publishes.
 */
export function cachedStrapiRequest<T>(
  name: string,
  query: string,
  variables?: Record<string, unknown>,
  revalidateSeconds = 600
): Promise<T> {
  const keyed = unstable_cache(
    async (vars: string) =>
      strapiClient.request<T>(query, JSON.parse(vars) as Record<string, unknown>),
    ["strapi-gql", name],
    { tags: ["strapi"], revalidate: revalidateSeconds }
  )
  return keyed(JSON.stringify(variables || {}))
}

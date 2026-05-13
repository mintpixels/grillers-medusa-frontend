import { GraphQLClient } from "graphql-request"

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
const strapiClient = new GraphQLClient(
  `${process.env.STRAPI_ENDPOINT}/graphql`,
  {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    fetch: (url, init) =>
      fetch(url as string, {
        ...(init as RequestInit),
        next: { tags: ["strapi"] },
      }),
  }
)

export default strapiClient

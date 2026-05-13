import { GraphQLClient } from "graphql-request"

// Strapi content is editor-managed and edits should reflect on the site
// immediately on publish. We support that with two complementary
// mechanisms:
//
// 1. Tag every Strapi fetch with "strapi" so `revalidateTag("strapi")`
//    can bust the cached response on demand. A Strapi webhook (configured
//    in Strapi admin → Settings → Webhooks) POSTs to /api/revalidate on
//    entry.publish / entry.update / entry.unpublish / media events,
//    which triggers the revalidateTag call. See docs/strapi-revalidate.md.
//
// 2. As a belt-and-suspenders fallback while the webhook is verified
//    end-to-end, also pass cache: "no-store". This forces every fetch
//    to hit Strapi fresh — slightly slower but guarantees content is
//    never stale. Once the webhook is wired and confirmed working, this
//    line can be removed to re-enable the Data Cache and pay one Strapi
//    request per content change instead of one per page render.
const strapiClient = new GraphQLClient(
  `${process.env.STRAPI_ENDPOINT}/graphql`,
  {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    fetch: (url, init) =>
      fetch(url as string, {
        ...(init as RequestInit),
        cache: "no-store",
        next: { tags: ["strapi"] },
      }),
  }
)

export default strapiClient

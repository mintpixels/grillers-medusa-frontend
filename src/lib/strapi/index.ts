import { GraphQLClient } from "graphql-request"

// Strapi content is editor-managed and edits should reflect on the site
// immediately. By default Next.js's Data Cache snapshots every fetch
// response and persists it across deployments — so a published Strapi
// change won't appear on production until the cache TTL expires or
// `revalidateTag` / `revalidatePath` is called. We don't currently wire
// a Strapi webhook to revalidate, so the safer default is to bypass the
// Data Cache for Strapi queries entirely. Strapi responses are small
// and fast; the per-request cost is acceptable at this site's scale.
const strapiClient = new GraphQLClient(
  `${process.env.STRAPI_ENDPOINT}/graphql`,
  {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    fetch: (url, init) =>
      fetch(url as string, { ...(init as RequestInit), cache: "no-store" }),
  }
)

export default strapiClient

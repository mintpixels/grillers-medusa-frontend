import { liteClient } from "algoliasearch/lite"

export const searchLiteClient = liteClient(
  process.env.ALGOLIA_APPLICATION_ID!,
  process.env.ALGOLIA_SEARCH_API_KEY!
)

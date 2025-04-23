import { GraphQLClient } from "graphql-request"

const strapiClient = new GraphQLClient(
  `${process.env.STRAPI_ENDPOINT}/graphql`,
  {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
  }
)

export default strapiClient

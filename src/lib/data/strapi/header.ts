import { gql } from "graphql-request"

export type HeaderNavLink = {
  Link: {
    id: string
    Text: string
    Url: string
  }
  Children: {
    id: string
    Text: string
    Url: string
  }[]
}

export const HeaderNavQuery = gql`
  query HeaderNav {
    header {
      HeaderNav {
        Link {
          id
          Text
          Url
        }
        Children {
          id
          Text
          Url
        }
      }
    }
  }
`

import { gql } from "graphql-request"

export const GetCommonPdpQuery = gql`
  query CommonPdpQuery {
    pdp {
      WhyUs {
        Title
        Image {
          url
        }
        List {
          id
          Title
          Description
        }
      }
      HowItWorks {
        Title
        Description
        Cards {
          Text
          Image {
            url
          }
          id
        }
      }
    }
  }
`

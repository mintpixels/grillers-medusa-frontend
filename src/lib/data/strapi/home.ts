import { gql } from "graphql-request"

export const GetHomePageQuery = gql`
  query HomePageQuery {
    home {
      Sections {
        __typename
        ... on ComponentHomeHero {
          HeroTitle: Title
          BackgroundImage {
            url
          }
        }
        ... on ComponentHomeBestsellers {
          BestsellersTitle: Title
          Products {
            id
            Title
            Slug
            Price
            Image {
              url
            }
            Description
          }
        }
        ... on ComponentHomeKosherPromise {
          TopLogo {
            url
          }
          KosherPromiseTitle: Title
          Content
          BadgeImage {
            url
          }
          FeatureText
          FeatureImage {
            url
          }
          Link {
            Text
            Url
          }
        }
        ... on ComponentHomeShopCollections {
          CollectionsTitle: Title
          Collections {
            id
            Title
            Slug
            Image {
              url
            }
          }
        }
        ... on ComponentHomeTestimonial {
          BackgroundImage {
            url
          }
          Quote
          Author
        }
        ... on ComponentHomeFollowUs {
          FollowUsTitle: Title
          Description
          SmallImages {
            url
          }
          BigImage {
            url
          }
        }
        ... on ComponentHomeBlogExplore {
          CategoryLabel
          BlogExploreTitle: Title
          Button {
            Text
            Url
          }
          QuoteDecorImage {
            url
          }
          MainImage {
            url
          }
        }
      }
    }
  }
`

import { gql } from "graphql-request"

export type CookieCategory = {
  id: string
  Name: string
  Description: string
  Required: boolean
}

export type CookieConsentData = {
  cookieConsent: {
    BannerMessage: string
    AcceptButtonText: string
    RejectButtonText: string
    PreferencesButtonText: string
    PrivacyPolicyLink?: string
    CookieCategories: CookieCategory[]
    Position?: string
    BackgroundColor?: string
    TextColor?: string
  }
}

export const GetCookieConsentQuery = gql`
  query CookieConsentQuery {
    cookieConsent {
      BannerMessage
      AcceptButtonText
      RejectButtonText
      PreferencesButtonText
      PrivacyPolicyLink
      CookieCategories {
        id
        Name
        Description
        Required
      }
      Position
      BackgroundColor
      TextColor
    }
  }
`


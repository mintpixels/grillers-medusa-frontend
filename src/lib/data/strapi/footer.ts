import { gql } from "graphql-request"

export type FooterLink = {
  id: string
  Text: string
  Url: string
}

export type FooterNavigationColumn = {
  id: string
  Title: string
  Links: FooterLink[]
}

export type FooterSocialLink = {
  id: string
  Platform: string
  Url: string
}

export type FooterCertificationBadge = {
  id: string
  Name: string
  Image?: {
    url: string
  }
  Description?: string
}

export type FooterData = {
  footer: {
    NavigationColumns: FooterNavigationColumn[]
    SocialLinks: FooterSocialLink[]
    ContactEmail?: string
    ContactPhone?: string
    ContactAddress?: string
    LegalLinks: FooterLink[]
    CertificationBadges: FooterCertificationBadge[]
    CopyrightText?: string
    ShowNewsletterSection?: boolean
    NewsletterTitle?: string
    NewsletterDescription?: string
  }
}

export const GetFooterQuery = gql`
  query FooterQuery {
    footer {
      NavigationColumns {
        id
        Title
        Links {
          id
          Text
          Url
        }
      }
      SocialLinks {
        id
        Platform
        Url
      }
      ContactEmail
      ContactPhone
      ContactAddress
      LegalLinks {
        id
        Text
        Url
      }
      CertificationBadges {
        id
        Name
        Image {
          url
        }
        Description
      }
      CopyrightText
      ShowNewsletterSection
      NewsletterTitle
      NewsletterDescription
    }
  }
`






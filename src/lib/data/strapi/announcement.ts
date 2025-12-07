import { gql } from "graphql-request"

export type AnnouncementBarData = {
  announcementBar: {
    Message: string
    LinkURL?: string
    LinkText?: string
    BackgroundColor?: string
    TextColor?: string
    StartDate?: string
    EndDate?: string
    Enabled: boolean
    Dismissible: boolean
  }
}

export const GetAnnouncementBarQuery = gql`
  query AnnouncementBarQuery {
    announcementBar {
      Message
      LinkURL
      LinkText
      BackgroundColor
      TextColor
      StartDate
      EndDate
      Enabled
      Dismissible
    }
  }
`


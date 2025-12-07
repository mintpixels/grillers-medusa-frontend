import { gql } from "graphql-request"

export type AnalyticsData = {
  analytic: {
    GA4MeasurementID?: string
    GTMContainerID?: string
    EnableAnalytics: boolean
    DebugMode?: boolean
  }
}

export const GetAnalyticsQuery = gql`
  query AnalyticsQuery {
    analytic {
      GA4MeasurementID
      GTMContainerID
      EnableAnalytics
      DebugMode
    }
  }
`


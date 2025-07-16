import { gql } from "graphql-request"

export type CheckoutShippingBlackoutData = {
  checkout: {
    ShippingBlackoutDaysOfWeek: string[]
    ShippingBlackoutDates: { BlackoutDate: string }[]
  }
}

export const CheckoutShippingBlackoutQuery = gql`
  query CheckoutShippingBlackout {
    checkout {
      ShippingBlackoutDaysOfWeek
      ShippingBlackoutDates {
        BlackoutDate
      }
    }
  }
`

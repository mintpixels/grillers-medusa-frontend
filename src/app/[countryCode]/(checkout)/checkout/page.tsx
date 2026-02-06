import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getAvailableFulfillmentTypes } from "@lib/data/fulfillment"
import strapiClient from "@lib/strapi"
import {
  GetCheckoutSEOQuery,
  FulfillmentConfigQuery,
  type CheckoutPageData,
  type FulfillmentConfigData,
} from "@lib/data/strapi/checkout"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

// Default fulfillment config for when Strapi isn't set up yet
const defaultFulfillmentConfig: FulfillmentConfigData["checkout"] = {
  // Atlanta delivery ZIP codes (from Strapi shipping-zones)
  AtlantaDeliveryZipCodes: ["30005", "30009", "30022", "30024", "30033", "30062", "30067"],
  SoutheastZipPrefixes: ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39"],
  // Southeast pickup locations - cities from Strapi shipping-zones with SCHEDULED_DELIVERY
  SoutheastPickupLocations: [
    { id: "nashville", Name: "Nashville, TN", Address: "TBD", City: "Nashville", State: "TN", ZipCode: "", AvailableDates: [], CutoffDays: 3 },
    { id: "raleigh", Name: "Raleigh, NC", Address: "TBD", City: "Raleigh", State: "NC", ZipCode: "", AvailableDates: [], CutoffDays: 3 },
    { id: "charlotte", Name: "Charlotte, NC", Address: "TBD", City: "Charlotte", State: "NC", ZipCode: "", AvailableDates: [], CutoffDays: 3 },
    { id: "birmingham", Name: "Birmingham, AL", Address: "TBD", City: "Birmingham", State: "AL", ZipCode: "", AvailableDates: [], CutoffDays: 3 },
    { id: "savannah", Name: "Savannah, GA", Address: "TBD", City: "Savannah", State: "GA", ZipCode: "", AvailableDates: [], CutoffDays: 3 },
    { id: "charleston", Name: "Charleston, SC", Address: "TBD", City: "Charleston", State: "SC", ZipCode: "", AvailableDates: [], CutoffDays: 3 },
  ],
  AtlantaDeliveryTimeWindows: [
    { id: "1", Label: "Morning (9am - 12pm)", StartTime: "09:00", EndTime: "12:00" },
    { id: "2", Label: "Afternoon (12pm - 4pm)", StartTime: "12:00", EndTime: "16:00" },
    { id: "3", Label: "Evening (4pm - 8pm)", StartTime: "16:00", EndTime: "20:00" },
  ],
  MinimumOrderThresholds: {
    PlantPickup: 0,
    AtlantaDelivery: 0,
    AtlantaDeliveryFree: 150,
    UPSShipping: 40,
    SoutheastPickup: 0,
  },
  PlantPickupAddress: "1945 Cliff Valley Way NE",
  PlantPickupCity: "Atlanta",
  PlantPickupState: "GA",
  PlantPickupZip: "30329",
  PlantPickupHours: "Mon-Thu 9am-4pm, Fri 9am-2pm",
  AtlantaDeliveryFee: 22.50,
}

async function getFulfillmentConfig(): Promise<FulfillmentConfigData["checkout"]> {
  try {
    const data = await strapiClient.request<FulfillmentConfigData>(
      FulfillmentConfigQuery
    )
    
    // Merge Strapi data with defaults - Strapi fields override defaults only if they exist
    if (data?.checkout) {
      return {
        ...defaultFulfillmentConfig,
        ...data.checkout,
        // Deep merge MinimumOrderThresholds to handle partial data
        MinimumOrderThresholds: {
          ...defaultFulfillmentConfig.MinimumOrderThresholds,
          ...(data.checkout.MinimumOrderThresholds || {}),
        },
      }
    }
    
    return defaultFulfillmentConfig
  } catch {
    return defaultFulfillmentConfig
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await strapiClient.request<CheckoutPageData>(GetCheckoutSEOQuery)
    const seo = data?.checkout?.SEO

    return {
      title: seo?.metaTitle || "Checkout | Grillers Pride",
      description:
        seo?.metaDescription ||
        "Complete your order at Grillers Pride. Secure checkout for premium kosher meats delivered fresh to your door.",
      robots: {
        index: false,
        follow: false,
      },
    }
  } catch (error) {
    return {
      title: "Checkout | Grillers Pride",
      description:
        "Complete your order at Grillers Pride. Secure checkout for premium kosher meats.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export default async function Checkout({ params }: PageProps) {
  const { countryCode } = await params
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // If cart is empty, redirect to cart page
  if (!cart.items || cart.items.length === 0) {
    redirect(`/${countryCode}/cart`)
  }

  // No longer redirect to fulfillment page - show fulfillment selection inline
  const customer = await retrieveCustomer()
  const fulfillmentConfig = await getFulfillmentConfig()
  
  // Fetch available fulfillment types from Medusa shipping options
  const availableFulfillmentTypes = await getAvailableFulfillmentTypes(cart.id)

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Two-tone background - only for checkout page */}
      <div className="fixed inset-0 hidden small:flex pointer-events-none -z-10" aria-hidden="true">
        <div className="w-[58%] bg-gray-50" />
        <div className="w-[42%] bg-Charcoal" />
      </div>

      <div className="small:grid small:grid-cols-[58%_42%]">
        {/* Left column - Form */}
        <div className="px-4 small:px-8 lg:px-16 xl:pl-[max(2rem,calc((100vw-1280px)/2+2rem))] xl:pr-12 py-8 small:py-12">
          <div className="max-w-xl">
            <PaymentWrapper cart={cart}>
              <CheckoutForm 
                cart={cart} 
                customer={customer} 
                fulfillmentConfig={fulfillmentConfig}
                availableFulfillmentTypes={availableFulfillmentTypes}
              />
            </PaymentWrapper>
          </div>
        </div>
        {/* Right column - Summary (dark background) */}
        <div className="px-4 small:px-8 lg:px-12 xl:pr-[max(2rem,calc((100vw-1280px)/2+2rem))] py-8 small:py-12 bg-Charcoal">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}

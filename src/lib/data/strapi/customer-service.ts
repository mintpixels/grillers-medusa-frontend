import { gql } from "graphql-request"
import strapiClient from "@lib/strapi"

export type FAQItem = {
  question: string
  answer: string
}

export type CustomerServiceData = {
  Title: string
  Intro: string
  ContactEmail: string
  ContactPhone: string
  ContactHours: string
  FAQs: FAQItem[]
  Content?: any[] // optional BlocksRenderer content for additional copy
  UpdatedAt?: string
}

// Strapi `customer-service` single type. If/when it's created in Strapi
// admin, this query starts returning data and the placeholder below is
// retired. Field names match the Strapi v5 single-type pattern.
export const GetCustomerServiceQuery = gql`
  query CustomerService {
    customerService {
      Title
      Intro
      ContactEmail
      ContactPhone
      ContactHours
      FAQs
      Content
      UpdatedAt: updatedAt
    }
  }
`

const PLACEHOLDER: CustomerServiceData = {
  Title: "Customer Service",
  Intro:
    "We're a family-run Atlanta butcher counter — when you have a question, a real person picks up. Use the channels below or scan the FAQ for the fastest answer.",
  ContactEmail: "peter@grillerspride.com",
  ContactPhone: "(770) 454-8108",
  ContactHours:
    "Monday–Thursday 9:00 AM – 5:00 PM ET · Friday 9:00 AM – 2:00 PM ET · Closed Saturday and major Jewish holidays",
  FAQs: [
    {
      question: "How do I know my meat is kosher?",
      answer:
        "Every product is supervised by the Atlanta Kashruth Commission (AKC), with a mashgiach on every shift since 2002. Each pack ships with the kashruth seal intact. The PDP for each item shows the specific hechsher.",
    },
    {
      question: "How does catch-weight pricing work?",
      answer:
        "Premium cuts are sold by the pound, but each piece weighs slightly differently. At checkout you're charged a target estimate; once your order is packed and weighed, your card is adjusted to reflect the exact weight. You only ever pay for what you actually receive.",
    },
    {
      question: "When will my order arrive?",
      answer:
        "Atlanta-area delivery: typically next-day if you order before noon ET. Southeast pickup: scheduled at one of our partner locations. Nationwide UPS shipping: 1–3 business days, packed in our cold-chain shipper that holds temperature for 72 hours.",
    },
    {
      question: "What's your free-shipping threshold?",
      answer:
        "Free Atlanta-area delivery on orders over $250 (in-region: GA, TN, TX, NC, FL, SC, AL). Free nationwide shipping on orders over $500. Otherwise standard shipping rates apply at checkout.",
    },
    {
      question: "How do I return an order?",
      answer:
        "Because of food safety, we can't accept returns of opened or thawed product. If your order arrives damaged, mis-packed, or thawed, contact us within 24 hours of delivery and we'll replace or refund. See our Terms of Sale for the full policy.",
    },
    {
      question: "Do you offer wholesale or B2B accounts?",
      answer:
        "Yes — we work with restaurants, caterers, and institutional buyers. Email us with your business details and we'll set you up with an account and pricing.",
    },
    {
      question: "Where are you located?",
      answer:
        "Our plant and counter are in Doraville, GA. Pickup is available at the plant; we also work with partner pickup locations across the Southeast.",
    },
    {
      question: "What if I have a special-occasion order?",
      answer:
        "Holidays (Pesach, Rosh Hashanah, Sukkot, Shabbos) and large gatherings — give us a call directly. We'll walk through quantities and timing so nothing gets cut close.",
    },
  ],
}

export async function getCustomerServiceData(): Promise<CustomerServiceData> {
  try {
    const data = await strapiClient.request<{
      customerService?: CustomerServiceData
    }>(GetCustomerServiceQuery)
    const cs = data?.customerService
    if (cs?.Title) {
      // Merge with placeholder so partial Strapi entries still render fully.
      return {
        ...PLACEHOLDER,
        ...cs,
        FAQs: cs.FAQs?.length ? cs.FAQs : PLACEHOLDER.FAQs,
      }
    }
  } catch {
    // Strapi `customer-service` single type not created yet — fall through
    // to placeholder.
  }
  return PLACEHOLDER
}

import { gql } from "graphql-request"

export type Testimonial = {
  id: string
  documentId: string
  CustomerName: string
  CustomerTitle?: string
  CustomerCompany?: string
  CustomerLocation?: string
  CustomerPhoto?: {
    url: string
  }
  TestimonialText: string
  Rating: number // 1-5
  Featured?: boolean
  Tags?: string[]
  PublishedDate?: string
}

export type TestimonialSectionConfig = {
  id: string
  Title?: string
  Subtitle?: string
  DisplayMode: "carousel" | "grid" | "featured" | "list"
  MaxItems?: number
  FilterByTags?: string[]
  ShowRatings?: boolean
  AutoRotate?: boolean
  AutoRotateInterval?: number
}

export type TestimonialsData = {
  testimonials: Testimonial[]
}

export type TestimonialSectionData = {
  testimonialSection: TestimonialSectionConfig
}

// Query to fetch all testimonials
export const GetTestimonialsQuery = gql`
  query GetTestimonials($limit: Int, $start: Int, $featured: Boolean) {
    testimonials(
      pagination: { limit: $limit, start: $start }
      filters: { Featured: { eq: $featured } }
      sort: ["PublishedDate:desc"]
    ) {
      documentId
      CustomerName
      CustomerTitle
      CustomerCompany
      CustomerLocation
      CustomerPhoto {
        url
      }
      TestimonialText
      Rating
      Featured
      Tags
      PublishedDate
    }
  }
`

// Query to fetch featured testimonials
export const GetFeaturedTestimonialsQuery = gql`
  query GetFeaturedTestimonials($limit: Int) {
    testimonials(
      pagination: { limit: $limit }
      filters: { Featured: { eq: true } }
      sort: ["PublishedDate:desc"]
    ) {
      documentId
      CustomerName
      CustomerTitle
      CustomerCompany
      CustomerLocation
      CustomerPhoto {
        url
      }
      TestimonialText
      Rating
      Featured
      Tags
      PublishedDate
    }
  }
`

// Query to fetch testimonial section configuration
export const GetTestimonialSectionQuery = gql`
  query GetTestimonialSection {
    testimonialSection {
      Title
      Subtitle
      DisplayMode
      MaxItems
      FilterByTags
      ShowRatings
      AutoRotate
      AutoRotateInterval
    }
  }
`


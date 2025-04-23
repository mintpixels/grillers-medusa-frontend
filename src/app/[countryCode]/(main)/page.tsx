import { Metadata } from "next"

// import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import BestsellersSection from "@modules/home/components/shop-bestsellers"
import KosherPromiseSection from "@modules/home/components/kosher-promise"
import ShopCollectionsSection from "@modules/home/components/shop-collections"
import TestimonialSection from "@modules/home/components/testimonial"
import FollowUsSection from "@modules/home/components/follow-us"
import BlogExploreSection from "@modules/home/components/blog-explore"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import strapiClient from "@lib/strapi"
import { GetHomePageQuery } from "@lib/data/strapi/home"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  const strapiData: any = await strapiClient.request(GetHomePageQuery)

  console.log("strapiData", strapiData?.home?.Sections)

  const renderSections = () => {
    if (strapiData?.home?.Sections) {
      return strapiData?.home?.Sections.map((section: any) => {
        switch (section.__typename) {
          case "ComponentHomeHero":
            return <Hero key={section.__typename} data={section} />
          case "ComponentHomeBestsellers":
            return (
              <BestsellersSection key={section.__typename} data={section} />
            )
          case "ComponentHomeKosherPromise":
            return (
              <KosherPromiseSection key={section.__typename} data={section} />
            )
          case "ComponentHomeShopCollections":
            return (
              <ShopCollectionsSection key={section.__typename} data={section} />
            )
          case "ComponentHomeTestimonial":
            return (
              <TestimonialSection key={section.__typename} data={section} />
            )
          case "ComponentHomeFollowUs":
            return <FollowUsSection key={section.__typename} data={section} />
          case "ComponentHomeBlogExplore":
            return (
              <BlogExploreSection key={section.__typename} data={section} />
            )
          default:
            return null
        }
      })
    }
    return null
  }

  return (
    <>
      {renderSections()}
      {/* <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div> */}
    </>
  )
}

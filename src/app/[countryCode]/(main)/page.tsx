import { Metadata } from "next"

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
import { GetHomePageQuery, type HomePageData } from "@lib/data/strapi/home"

export async function generateMetadata(): Promise<Metadata> {
  try {
    const strapiData = await strapiClient.request<HomePageData>(GetHomePageQuery)
    const seo = strapiData?.home?.SEO
    const socialMeta = strapiData?.home?.SocialMeta

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"

    return {
      title: seo?.metaTitle || "Grillers Pride | Premium Kosher Meats",
      description:
        seo?.metaDescription ||
        "Shop premium kosher meats at Grillers Pride. Fresh, high-quality cuts delivered to your door. 100% kosher certified.",
      openGraph: {
        title: socialMeta?.ogTitle || seo?.metaTitle || "Grillers Pride",
        description:
          socialMeta?.ogDescription ||
          seo?.metaDescription ||
          "Premium kosher meats delivered fresh to your door.",
        type: (socialMeta?.ogType as any) || "website",
        url: baseUrl,
        siteName: "Grillers Pride",
        images: socialMeta?.ogImage?.url
          ? [
              {
                url: socialMeta.ogImage.url,
                alt: socialMeta.ogImageAlt || "Grillers Pride",
              },
            ]
          : undefined,
      },
      twitter: {
        card: (socialMeta?.twitterCard as any) || "summary_large_image",
        title: socialMeta?.twitterTitle || seo?.metaTitle || "Grillers Pride",
        description:
          socialMeta?.twitterDescription ||
          seo?.metaDescription ||
          "Premium kosher meats delivered fresh.",
        images: socialMeta?.twitterImage?.url
          ? [socialMeta.twitterImage.url]
          : undefined,
        site: socialMeta?.twitterSite,
        creator: socialMeta?.twitterCreator,
      },
    }
  } catch (error) {
    console.error("Error fetching home page SEO:", error)
    return {
      title: "Grillers Pride | Premium Kosher Meats",
      description:
        "Shop premium kosher meats at Grillers Pride. Fresh, high-quality cuts delivered to your door.",
    }
  }
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

  const strapiData = await strapiClient.request<HomePageData>(GetHomePageQuery)

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

  return <>{renderSections()}</>
}

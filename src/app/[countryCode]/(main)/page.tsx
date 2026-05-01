import React from "react"
import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import TrustBand from "@modules/home/components/trust-band"
import BestsellersSection from "@modules/home/components/shop-bestsellers"
import KosherPromiseSection from "@modules/home/components/kosher-promise"
import WholesaleBand from "@modules/home/components/wholesale-band"
import ShopCollectionsSection from "@modules/home/components/shop-collections"
import TestimonialSection from "@modules/home/components/testimonial"
import FollowUsSection from "@modules/home/components/follow-us"
import BlogExploreSection from "@modules/home/components/blog-explore"
import LazySection from "@modules/common/components/lazy-section"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import strapiClient from "@lib/strapi"
import { GetHomePageQuery, type HomePageData } from "@lib/data/strapi/home"
import {
  GetGlobalQuery,
  type GlobalData,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from "@lib/data/strapi/global"
import { generateAlternates } from "@lib/util/seo"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  try {
    const strapiData = await strapiClient.request<HomePageData>(GetHomePageQuery)
    const seo = strapiData?.home?.SEO
    const socialMeta = strapiData?.home?.SocialMeta

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
    const alternates = await generateAlternates("", countryCode)

    return {
      title: seo?.metaTitle || "Grillers Pride | Premium Kosher Meats",
      description:
        seo?.metaDescription ||
        "Shop premium kosher meats at Grillers Pride. Fresh, high-quality cuts delivered to your door. 100% kosher certified.",
      alternates,
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

  // Customer state for the conditional Hero CTA (#57). Both calls swallow
  // errors — homepage must render for logged-out visitors too.
  const customer = await retrieveCustomer().catch(() => null)
  const orders = customer
    ? await listOrders().catch(() => null)
    : null
  const isLoggedIn = !!customer
  const hasOrders = (orders?.length || 0) > 0

  const strapiData = await strapiClient.request<HomePageData>(GetHomePageQuery)
  
  // Fetch global data for Organization JSON-LD
  let globalData: GlobalData | null = null
  try {
    globalData = await strapiClient.request<GlobalData>(GetGlobalQuery)
  } catch (error) {
    console.error("Error fetching global data:", error)
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://grillerspride.com"
  const organizationJsonLd = globalData?.global
    ? generateOrganizationJsonLd(globalData.global, baseUrl)
    : null
  const websiteJsonLd = generateWebSiteJsonLd(baseUrl, countryCode)

  const renderSections = () => {
    if (strapiData?.home?.Sections) {
      return strapiData?.home?.Sections.map((section: any, index: number) => {
        // Above-the-fold sections (first 3) render immediately
        const isAboveFold = index < 3

        switch (section.__typename) {
          case "ComponentHomeHero":
            // Hero always renders immediately. TrustBand sits directly under
            // it so the value props are visible above the fold (#58).
            return (
              <React.Fragment key={section.__typename}>
                <Hero
                  data={section}
                  countryCode={countryCode}
                  isLoggedIn={isLoggedIn}
                  hasOrders={hasOrders}
                />
                <TrustBand customer={customer} phoneNumber={null} />
              </React.Fragment>
            )
          case "ComponentHomeBestsellers":
            return (
              <BestsellersSection
                key={section.__typename}
                data={section}
                countryCode={countryCode}
              />
            )
          case "ComponentHomeKosherPromise":
            return (
              <React.Fragment key={section.__typename}>
                <KosherPromiseSection data={section} />
                <WholesaleBand />
              </React.Fragment>
            )
          case "ComponentHomeShopCollections":
            return (
              <ShopCollectionsSection key={section.__typename} data={section} />
            )
          case "ComponentHomeTestimonial":
            // Lazy load testimonial section (typically below fold)
            return isAboveFold ? (
              <TestimonialSection key={section.__typename} data={section} />
            ) : (
              <LazySection key={section.__typename} minHeight="500px">
                <TestimonialSection data={section} />
              </LazySection>
            )
          case "ComponentHomeFollowUs":
            // Lazy load follow us section (typically below fold)
            return isAboveFold ? (
              <FollowUsSection key={section.__typename} data={section} />
            ) : (
              <LazySection key={section.__typename} minHeight="400px">
                <FollowUsSection data={section} />
              </LazySection>
            )
          case "ComponentHomeBlogExplore":
            // Lazy load blog section (typically below fold)
            return isAboveFold ? (
              <BlogExploreSection key={section.__typename} data={section} />
            ) : (
              <LazySection key={section.__typename} minHeight="500px">
                <BlogExploreSection data={section} />
              </LazySection>
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
      {/* Organization + WebSite JSON-LD for SEO (Google Knowledge Panel + sitelinks searchbox) */}
      {organizationJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {renderSections()}
    </>
  )
}

import React from "react"
import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import TrustBand from "@modules/home/components/trust-band"
import BestsellersSection from "@modules/home/components/shop-bestsellers"
import KosherPromiseSection from "@modules/home/components/kosher-promise"
import WholesaleBand from "@modules/home/components/wholesale-band"
import ShopCollectionsSection from "@modules/home/components/shop-collections"
import LearnEntrySection from "@modules/home/components/learn-entry"
import FollowUsSection from "@modules/home/components/follow-us"
import BlogExploreSection from "@modules/home/components/blog-explore"
import ReorderRow from "@modules/home/components/reorder-row"
import HolidayBanner from "@modules/home/components/holiday-banner"
import SpecialtyRow from "@modules/home/components/specialty-row"
import DeliveryPromiseSection from "@modules/home/components/delivery-promise"
import LazySection from "@modules/common/components/lazy-section"
import StandardsComparison from "@modules/common/components/standards-comparison"
import { getRegion } from "@lib/data/regions"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import {
  getLatestOrderDeliveryZip,
  listPurchaseHistory,
} from "@lib/data/orders"
import {
  getProductsByMedusaLookupRefs,
  type StrapiCollectionProduct,
} from "@lib/data/strapi/collections"
import { getCuratedCollectionCards } from "@lib/data/strapi/curated-collections"
import strapiClient from "@lib/strapi"
import { GetHomePageQuery, type HomePageData } from "@lib/data/strapi/home"
import {
  GetGlobalQuery,
  type GlobalData,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from "@lib/data/strapi/global"
import { generateAlternates } from "@lib/util/seo"
import { getBaseURL } from "@lib/util/env"
import { withTimeout } from "@lib/util/promise-timeout"
import {
  getAddressBookDeliveryZip,
  normalizeDeliveryZip,
} from "@lib/util/delivery-zip"
import ExperimentExposure from "@lib/experiments/exposure"
import { getExperimentAssignment } from "@lib/experiments/server"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

type PurchaseHistory = Awaited<ReturnType<typeof listPurchaseHistory>>
type ReorderStrapiMap = Record<string, StrapiCollectionProduct>
type CuratedCollectionCards = Awaited<
  ReturnType<typeof getCuratedCollectionCards>
>
type CustomerZipSource = "cart" | "address" | "recent_order" | null
type CustomerZipState = {
  customerZip: string | null
  customerZipSource: CustomerZipSource
}

function presentString(value: string | null | undefined): value is string {
  return Boolean(value)
}

async function getReorderStrapiMap(
  purchaseHistory: PurchaseHistory
): Promise<ReorderStrapiMap> {
  const reorderStrapiMap: ReorderStrapiMap = {}

  if (!purchaseHistory.length) {
    return reorderStrapiMap
  }

  const ids = Array.from(
    new Set(purchaseHistory.map((h) => h.productId).filter(presentString))
  )
  const variantIds = Array.from(
    new Set(purchaseHistory.map((h) => h.variantId).filter(presentString))
  )
  const skus = Array.from(
    new Set(purchaseHistory.map((h) => h.sku).filter(presentString))
  )

  if (!ids.length && !variantIds.length && !skus.length) {
    return reorderStrapiMap
  }

  try {
    const strapiProducts = await withTimeout(
      getProductsByMedusaLookupRefs(
        { productIds: ids, variantIds, skus },
        strapiClient
      ),
      1800,
      [],
      "home reorder enrichment"
    )

    for (const sp of strapiProducts) {
      if (sp.MedusaProduct?.ProductId) {
        reorderStrapiMap[sp.MedusaProduct.ProductId] = sp
      }
      for (const variant of sp.MedusaProduct?.Variants || []) {
        if (variant.VariantId) {
          reorderStrapiMap[variant.VariantId] = sp
        }
        if (variant.Sku) {
          reorderStrapiMap[variant.Sku.trim().toLowerCase()] = sp
        }
      }
    }
  } catch (error) {
    console.error("Error fetching reorder strapi enrichment:", error)
  }

  return reorderStrapiMap
}

async function ReorderRowBlock({
  history,
  strapiMapPromise,
  firstName,
  countryCode,
}: {
  history: PurchaseHistory
  strapiMapPromise: Promise<ReorderStrapiMap>
  firstName?: string | null
  countryCode: string
}) {
  const strapiMap = await strapiMapPromise

  return (
    <ReorderRow
      history={history}
      strapiMap={strapiMap}
      firstName={firstName}
      countryCode={countryCode}
    />
  )
}

async function ShopCollectionsBlock({
  data,
  countryCode,
  collectionsPromise,
}: {
  data: any
  countryCode: string
  collectionsPromise: Promise<CuratedCollectionCards>
}) {
  const collections = await collectionsPromise

  return (
    <ShopCollectionsSection
      data={data}
      countryCode={countryCode}
      collections={collections}
    />
  )
}

async function DeliveryPromiseBlock({
  countryCode,
  customerZipPromise,
  isLoggedIn,
}: {
  countryCode: string
  customerZipPromise: Promise<CustomerZipState>
  isLoggedIn: boolean
}) {
  const { customerZip, customerZipSource } = await customerZipPromise

  return (
    <DeliveryPromiseSection
      countryCode={countryCode}
      customerZip={customerZip}
      customerZipSource={customerZipSource}
      isLoggedIn={isLoggedIn}
    />
  )
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode } = await params
  try {
    const strapiData = await strapiClient.request<HomePageData>(
      GetHomePageQuery
    )
    const seo = strapiData?.home?.SEO
    const socialMeta = strapiData?.home?.SocialMeta

    const baseUrl = getBaseURL()
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

  const [region, customer, cart, strapiData, globalData] = await Promise.all([
    withTimeout(getRegion(countryCode), 1200, null, "home region"),
    withTimeout(
      retrieveCustomer().catch(() => null),
      1000,
      null,
      "home customer"
    ),
    withTimeout(
      retrieveCart().catch(() => null),
      1000,
      null,
      "home cart"
    ),
    withTimeout(
      strapiClient.request<HomePageData>(GetHomePageQuery).catch(() => null),
      3000,
      null,
      "home Strapi data"
    ),
    withTimeout(
      strapiClient.request<GlobalData>(GetGlobalQuery).catch(() => null),
      1500,
      null,
      "home global data"
    ),
  ])

  if (!region) {
    return null
  }

  // Customer state for the conditional Hero CTA (#57). Legacy QuickBooks
  // history counts here, not just native Medusa orders, so migrated customers
  // immediately get the reorder path on first login.
  const isLoggedIn = !!customer
  const cartZip = normalizeDeliveryZip(cart?.shipping_address?.postal_code)
  const addressBookZip = getAddressBookDeliveryZip(customer?.addresses)
  const latestOrderZipPromise =
    isLoggedIn && !cartZip && !addressBookZip
      ? withTimeout(
          getLatestOrderDeliveryZip().catch(() => ""),
          1000,
          "",
          "home latest order delivery zip"
        )
      : Promise.resolve("")
  const customerZipPromise: Promise<CustomerZipState> =
    latestOrderZipPromise.then((latestOrderZip) => {
      const customerZip = cartZip || addressBookZip || latestOrderZip || null
      const customerZipSource: CustomerZipSource = cartZip
        ? "cart"
        : addressBookZip
        ? "address"
        : latestOrderZip
        ? "recent_order"
        : null

      return { customerZip, customerZipSource }
    })

  // Reorder-row data: fetch purchase history for logged-in customers. This
  // combines native Medusa orders and the QuickBooks-backed legacy projection.
  // Guests skip the call so the homepage RSC stays fast for them. (#53)
  const purchaseHistory = isLoggedIn
    ? await withTimeout(
        listPurchaseHistory().catch(() => []),
        1200,
        [],
        "home purchase history"
      )
    : []
  const hasOrders = purchaseHistory.length > 0
  const reorderStrapiMapPromise = getReorderStrapiMap(purchaseHistory)

  const homeCuratedCollectionsPromise = withTimeout(
    getCuratedCollectionCards({
      surface: "homepage",
      customerState: hasOrders ? "returning" : "guest_or_no_orders",
      limit: 8,
    }),
    1800,
    [],
    "home curated collection cards"
  )
  const hasShopCollectionsSection = Boolean(
    strapiData?.home?.Sections?.some(
      (section: any) => section.__typename === "ComponentHomeShopCollections"
    )
  )
  const fallbackCollectionsSection = {
    CollectionsTitle: "Build a full table",
    Collections: [],
  }

  const baseUrl = getBaseURL()
  // Always emit Organization JSON-LD — defaults kick in when Strapi Global
  // isn't populated yet so Google still gets the entity for the Knowledge Panel.
  const organizationJsonLd = generateOrganizationJsonLd(
    globalData?.global,
    baseUrl
  )
  const websiteJsonLd = generateWebSiteJsonLd(baseUrl, countryCode)
  const homepageExperiment = await getExperimentAssignment(
    "homepage_shopping_flow_v1",
    {
      routeMarket: countryCode,
      customerType: customer ? "registered" : "guest",
      userId: customer?.id,
    }
  )

  const renderSections = () => {
    if (strapiData?.home?.Sections) {
      return strapiData?.home?.Sections.map((section: any, index: number) => {
        const isAboveFold = index < 3

        switch (section.__typename) {
          case "ComponentHomeHero":
            return (
              <React.Fragment key={section.__typename}>
                <Hero
                  data={section}
                  countryCode={countryCode}
                  isLoggedIn={isLoggedIn}
                  hasOrders={hasOrders}
                />
                <TrustBand customer={customer} phoneNumber={null} />
                <HolidayBanner />
              </React.Fragment>
            )
          case "ComponentHomeBestsellers":
            return (
              <React.Fragment key={section.__typename}>
                {isLoggedIn && hasOrders && purchaseHistory.length > 0 && (
                  <React.Suspense fallback={null}>
                    <ReorderRowBlock
                      history={purchaseHistory}
                      strapiMapPromise={reorderStrapiMapPromise}
                      firstName={customer?.first_name}
                      countryCode={countryCode}
                    />
                  </React.Suspense>
                )}
                <React.Suspense fallback={null}>
                  <BestsellersSection
                    data={section}
                    countryCode={countryCode}
                  />
                </React.Suspense>
                {!hasShopCollectionsSection && (
                  <>
                    <React.Suspense fallback={null}>
                      <ShopCollectionsBlock
                        data={fallbackCollectionsSection}
                        countryCode={countryCode}
                        collectionsPromise={homeCuratedCollectionsPromise}
                      />
                    </React.Suspense>
                    <React.Suspense fallback={null}>
                      <DeliveryPromiseBlock
                        countryCode={countryCode}
                        customerZipPromise={customerZipPromise}
                        isLoggedIn={isLoggedIn}
                      />
                    </React.Suspense>
                    <StandardsComparison />
                    <LearnEntrySection />
                  </>
                )}
              </React.Fragment>
            )
          case "ComponentHomeKosherPromise":
            return (
              <React.Fragment key={section.__typename}>
                <React.Suspense fallback={null}>
                  <SpecialtyRow countryCode={countryCode} />
                </React.Suspense>
                <KosherPromiseSection data={section} />
                <WholesaleBand />
              </React.Fragment>
            )
          case "ComponentHomeShopCollections":
            return (
              <React.Fragment key={section.__typename}>
                <React.Suspense fallback={null}>
                  <ShopCollectionsBlock
                    data={section}
                    countryCode={countryCode}
                    collectionsPromise={homeCuratedCollectionsPromise}
                  />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <DeliveryPromiseBlock
                    countryCode={countryCode}
                    customerZipPromise={customerZipPromise}
                    isLoggedIn={isLoggedIn}
                  />
                </React.Suspense>
                <StandardsComparison />
                <LearnEntrySection />
              </React.Fragment>
            )
          case "ComponentHomeTestimonial":
            return null
          case "ComponentHomeFollowUs":
            return isAboveFold ? (
              <FollowUsSection key={section.__typename} data={section} />
            ) : (
              <LazySection key={section.__typename} minHeight="360px">
                <FollowUsSection data={section} />
              </LazySection>
            )
          case "ComponentHomeBlogExplore":
            return isAboveFold ? (
              <BlogExploreSection key={section.__typename} data={section} />
            ) : (
              <LazySection key={section.__typename} minHeight="360px">
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
      <ExperimentExposure assignment={homepageExperiment} />
      {/* Organization + WebSite JSON-LD for SEO (Google Knowledge Panel + sitelinks searchbox) */}
      {organizationJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
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

import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPublishedLearnArticle } from "@lib/data/strapi/learn"
import { getBaseURL } from "@lib/util/env"
import { generateAlternates } from "@lib/util/seo"
import {
  getLearnArticleStaticParams,
  normalizeLearnSlug,
} from "@modules/learn/data/butcher-guides"
import LearnArticleTemplate from "@modules/learn/templates/learn-article"

type PageProps = {
  params: Promise<{ countryCode: string; slug: string[] }>
}

export async function generateStaticParams() {
  return getLearnArticleStaticParams()
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode, slug } = await params
  const article = await getPublishedLearnArticle(slug)

  if (!article) {
    return {
      title: "Not Found | Grillers Pride",
    }
  }

  const path = `/learn/${normalizeLearnSlug(slug)}`
  const alternates = await generateAlternates(path, countryCode)
  const url = `${getBaseURL()}/${countryCode}${path}`

  return {
    title: article.metaTitle,
    description: article.description,
    alternates,
    openGraph: {
      title: article.metaTitle,
      description: article.description,
      type: "article",
      url,
      siteName: "Grillers Pride",
      images: [
        {
          url: article.heroImage,
          alt: article.heroAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.description,
      images: [article.heroImage],
    },
  }
}

export default async function LearnArticlePage({ params }: PageProps) {
  const { countryCode, slug } = await params
  const article = await getPublishedLearnArticle(slug)

  if (!article) notFound()

  const path = `/learn/${article.slug}`
  const pageUrl = `${getBaseURL()}/${countryCode}${path}`
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.heroImage,
    author: {
      "@type": "Organization",
      name: "Grillers Pride",
    },
    publisher: {
      "@type": "Organization",
      name: "Grillers Pride",
      url: getBaseURL(),
    },
    mainEntityOfPage: pageUrl,
    about: [article.category, "Kosher meat", "Butcher education"],
  }
  const faqJsonLd =
    article.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${getBaseURL()}/${countryCode}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Butcher Guide",
        item: `${getBaseURL()}/${countryCode}/learn`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: pageUrl,
      },
    ],
  }

  return (
    <>
      {[articleJsonLd, faqJsonLd, breadcrumbJsonLd]
        .filter(Boolean)
        .map((jsonLd, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ))}
      <LearnArticleTemplate article={article} countryCode={countryCode} />
    </>
  )
}

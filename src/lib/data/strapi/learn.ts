import { gql } from "graphql-request"

import strapiClient from "@lib/strapi"
import {
  getLearnArticle,
  normalizeLearnSlug,
  type LearnArticle,
  type LearnArticleCategory,
  type LearnArticleSection,
} from "@modules/learn/data/butcher-guides"

type StrapiLink = {
  Text?: string | null
  Url?: string | null
}

type StrapiQuickFact = {
  Label?: string | null
  Value?: string | null
}

type StrapiSection = {
  SectionId?: string | null
  Heading?: string | null
  Body?: unknown
  Bullets?: unknown
  TableColumns?: unknown
  TableRows?: unknown
  Callout?: string | null
}

type StrapiFaq = {
  Question?: string | null
  Answer?: string | null
}

type StrapiLearnArticle = {
  Title?: string | null
  Slug?: string | null
  Category?: string | null
  Description?: string | null
  ReadTime?: string | null
  UpdatedLabel?: string | null
  HeroImage?: { url?: string | null; alternativeText?: string | null } | null
  HeroImageAlt?: string | null
  QuickAnswer?: string | null
  Facts?: StrapiQuickFact[] | null
  Sections?: StrapiSection[] | null
  FAQs?: StrapiFaq[] | null
  PrimaryCta?: StrapiLink | null
  SecondaryCta?: StrapiLink | null
  RelatedLinks?: StrapiLink[] | null
  SourceLinks?: StrapiLink[] | null
  SEO?: {
    metaTitle?: string | null
    metaDescription?: string | null
    canonicalUrl?: string | null
  } | null
}

type LearnArticleQueryData = {
  learnArticles?: StrapiLearnArticle[] | null
}

const GetLearnArticleBySlugQuery = gql`
  query GetLearnArticleBySlug($slug: String!) {
    learnArticles(filters: { Slug: { eq: $slug } }, pagination: { limit: 1 }) {
      Title
      Slug
      Category
      Description
      ReadTime
      UpdatedLabel
      HeroImage {
        url
        alternativeText
      }
      HeroImageAlt
      QuickAnswer
      Facts {
        Label
        Value
      }
      Sections {
        SectionId
        Heading
        Body
        Bullets
        TableColumns
        TableRows
        Callout
      }
      FAQs {
        Question
        Answer
      }
      PrimaryCta {
        Text
        Url
      }
      SecondaryCta {
        Text
        Url
      }
      RelatedLinks {
        Text
        Url
      }
      SourceLinks {
        Text
        Url
      }
      SEO {
        metaTitle
        metaDescription
        canonicalUrl
      }
    }
  }
`

export async function getPublishedLearnArticle(
  slug: string | string[]
): Promise<LearnArticle | null> {
  const normalizedSlug = normalizeLearnSlug(slug)
  const fallback = getLearnArticle(normalizedSlug)

  try {
    const data = await strapiClient.request<LearnArticleQueryData>(
      GetLearnArticleBySlugQuery,
      { slug: normalizedSlug }
    )
    const article = data.learnArticles?.[0]
    if (!article?.Title || !article.Slug || !article.QuickAnswer) {
      return fallback || null
    }

    return normalizeStrapiArticle(article, fallback)
  } catch {
    return fallback || null
  }
}

function normalizeStrapiArticle(
  article: StrapiLearnArticle,
  fallback?: LearnArticle
): LearnArticle {
  return {
    slug: article.Slug || fallback?.slug || "",
    category:
      normalizeCategory(article.Category) ||
      fallback?.category ||
      "Cooking & Buying Guides",
    title: article.Title || fallback?.title || "",
    metaTitle:
      article.SEO?.metaTitle || fallback?.metaTitle || article.Title || "",
    description:
      article.SEO?.metaDescription ||
      article.Description ||
      fallback?.description ||
      "",
    updated: article.UpdatedLabel || fallback?.updated || "",
    readTime: article.ReadTime || fallback?.readTime || "",
    heroImage: article.HeroImage?.url || fallback?.heroImage || "",
    heroAlt:
      article.HeroImageAlt ||
      article.HeroImage?.alternativeText ||
      fallback?.heroAlt ||
      "",
    quickAnswer: article.QuickAnswer || fallback?.quickAnswer || "",
    facts: normalizeFacts(article.Facts, fallback?.facts),
    sections: normalizeSections(article.Sections, fallback?.sections),
    faqs: normalizeFaqs(article.FAQs, fallback?.faqs),
    primaryCta: normalizeLink(article.PrimaryCta) || fallback?.primaryCta,
    secondaryCta: normalizeLink(article.SecondaryCta) || fallback?.secondaryCta,
    related: normalizeLinks(article.RelatedLinks, fallback?.related),
    sources: normalizeLinks(article.SourceLinks, fallback?.sources),
  }
}

function normalizeCategory(value?: string | null): LearnArticleCategory | null {
  if (
    value === "Kosher Meat 101" ||
    value === "Cut Library" ||
    value === "Cooking & Buying Guides"
  ) {
    return value
  }
  return null
}

function normalizeFacts(
  facts?: StrapiQuickFact[] | null,
  fallback: LearnArticle["facts"] = []
) {
  const normalized = (facts || [])
    .map((fact) => ({
      label: fact.Label || "",
      value: fact.Value || "",
    }))
    .filter((fact) => fact.label && fact.value)

  return normalized.length ? normalized : fallback
}

function normalizeSections(
  sections?: StrapiSection[] | null,
  fallback: LearnArticleSection[] = []
): LearnArticleSection[] {
  const normalized = (sections || [])
    .map((section) => {
      const columns = stringArray(section.TableColumns)
      const rows = tableRows(section.TableRows)
      return {
        id: section.SectionId || slugify(section.Heading || ""),
        heading: section.Heading || "",
        body: blocksToParagraphs(section.Body),
        bullets: stringArray(section.Bullets),
        table:
          columns.length && rows.length
            ? {
                columns,
                rows,
              }
            : undefined,
        callout: section.Callout || undefined,
      }
    })
    .filter((section) => section.id && section.heading)

  return normalized.length ? normalized : fallback
}

function normalizeFaqs(
  faqs?: StrapiFaq[] | null,
  fallback: LearnArticle["faqs"] = []
) {
  const normalized = (faqs || [])
    .map((faq) => ({
      question: faq.Question || "",
      answer: faq.Answer || "",
    }))
    .filter((faq) => faq.question && faq.answer)

  return normalized.length ? normalized : fallback
}

function normalizeLink(link?: StrapiLink | null) {
  if (!link?.Text || !link.Url) return undefined
  return {
    label: link.Text,
    href: link.Url,
  }
}

function normalizeLinks(
  links?: StrapiLink[] | null,
  fallback: LearnArticle["related"] = []
) {
  const normalized = (links || [])
    .map(normalizeLink)
    .filter((link): link is { label: string; href: string } => Boolean(link))

  return normalized.length ? normalized : fallback
}

function blocksToParagraphs(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }

  if (!Array.isArray(value)) return []

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return ""
      const children = (block as { children?: unknown }).children
      if (!Array.isArray(children)) return ""

      return children
        .map((child) => {
          if (!child || typeof child !== "object") return ""
          const text = (child as { text?: unknown }).text
          return typeof text === "string" ? text : ""
        })
        .join("")
        .trim()
    })
    .filter(Boolean)
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function tableRows(value: unknown): string[][] {
  if (!Array.isArray(value)) return []

  return value
    .map((row) => {
      if (!Array.isArray(row)) return []
      return row.map((cell) => String(cell))
    })
    .filter((row) => row.length)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

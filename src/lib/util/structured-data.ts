export type BreadcrumbEntry = {
  name: string
  path: string
}

export type ListEntry = {
  name: string
  path: string
  description?: string | null
  image?: string | null
  type?: string
}

type PageSchemaInput = {
  baseUrl: string
  countryCode: string
  path: string
  name: string
  description?: string | null
  type?: string
  breadcrumbs?: BreadcrumbEntry[]
  mainEntity?: unknown
  about?: string[]
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "")
}

export function absoluteSiteUrl(baseUrl: string, path = "") {
  const normalizedBase = baseUrl.replace(/\/+$/g, "")
  const normalizedPath = trimSlashes(path)

  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase
}

export function localizedPath(countryCode: string, path = "") {
  const cleanPath = trimSlashes(path)
  return cleanPath ? `/${countryCode}/${cleanPath}` : `/${countryCode}`
}

export function breadcrumbJsonLd(
  baseUrl: string,
  countryCode: string,
  entries: BreadcrumbEntry[]
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteSiteUrl(baseUrl, countryCode),
      },
      ...entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: entry.name,
        item: absoluteSiteUrl(baseUrl, localizedPath(countryCode, entry.path)),
      })),
    ],
  }
}

export function itemListJsonLd(
  baseUrl: string,
  countryCode: string,
  name: string,
  entries: ListEntry[]
) {
  return {
    "@type": "ItemList",
    name,
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": entry.type || "Thing",
        name: entry.name,
        url: absoluteSiteUrl(baseUrl, localizedPath(countryCode, entry.path)),
        ...(entry.description && { description: entry.description }),
        ...(entry.image && { image: entry.image }),
      },
    })),
  }
}

export function webPageJsonLd({
  baseUrl,
  countryCode,
  path,
  name,
  description,
  type = "WebPage",
  breadcrumbs,
  mainEntity,
  about,
}: PageSchemaInput) {
  const url = absoluteSiteUrl(baseUrl, localizedPath(countryCode, path))

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    name,
    url,
    ...(description ? { description } : {}),
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl.replace(/\/+$/g, "")}/#website`,
      name: "Grillers Pride",
      url: baseUrl,
    },
    ...(breadcrumbs && breadcrumbs.length > 0
      ? { breadcrumb: breadcrumbJsonLd(baseUrl, countryCode, breadcrumbs) }
      : {}),
    ...(mainEntity ? { mainEntity } : {}),
    ...(about && about.length > 0 ? { about } : {}),
  }
}

export function faqPageJsonLd(
  faqs: Array<{ Question?: string; Answer?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .filter((faq) => faq.Question && faq.Answer)
      .map((faq) => ({
        "@type": "Question",
        name: faq.Question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.Answer,
        },
      })),
  }
}

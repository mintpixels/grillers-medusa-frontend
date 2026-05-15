import Link from "next/link"
import Script from "next/script"

type BreadcrumbItem = {
  name: string
  href: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  currentPage: string
}

export default function Breadcrumb({ items, currentPage }: BreadcrumbProps) {
  // Build JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || ""}${item.href}`,
      })),
      {
        "@type": "ListItem",
        position: items.length + 1,
        name: currentPage,
      },
    ],
  }

  return (
    <>
      {/* JSON-LD Schema for SEO */}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visual Breadcrumb Navigation.
          At narrow viewports the last segment can exceed the line; truncate
          it instead of running off-screen. Intermediate items wrap normally. */}
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex flex-wrap items-center gap-x-2 text-p-sm font-maison-neue">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center">
              <Link
                href={item.href}
                className="text-Charcoal/60 hover:text-Charcoal transition-colors"
              >
                {item.name}
              </Link>
              <span className="mx-2 text-Charcoal/40" aria-hidden="true">
                /
              </span>
            </li>
          ))}
          <li className="min-w-0 max-w-[60vw] sm:max-w-none">
            <span
              className="block truncate text-Charcoal font-medium"
              aria-current="page"
              title={currentPage}
            >
              {currentPage}
            </span>
          </li>
        </ol>
      </nav>
    </>
  )
}

type ProductCategory = {
  name: string
  handle: string
  parent_category?: ProductCategory | null
}

// Helper function to build breadcrumb items for product pages.
// Use storefront collection URLs only. The app has no /categories/[handle]
// route, so Medusa category trails must not be emitted as clickable crumbs.
const COLLECTION_HANDLE_OVERRIDES: Record<string, string> = {
  beef: "kosher-beef",
  chicken: "kosher-chicken",
  poultry: "kosher-chicken",
  lamb: "kosher-lamb",
  turkey: "kosher-turkey",
  duck: "kosher-duck",
  veal: "kosher-veal",
  prepared: "prepared-and-provisions",
  "prepared-foods": "prepared-and-provisions",
  "prepared-and-provisions": "prepared-and-provisions",
}

function slugifyCollectionName(value: string): string {
  return value
    .replace(/^L2:\s*/i, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function normalizeCollectionHandle(handle: string): string {
  let decoded: string
  try {
    decoded = decodeURIComponent(handle)
  } catch {
    decoded = handle
  }

  const slug = slugifyCollectionName(decoded)

  if (COLLECTION_HANDLE_OVERRIDES[slug]) {
    return COLLECTION_HANDLE_OVERRIDES[slug]
  }

  if (slug.startsWith("kosher-")) {
    return slug
  }

  if (/^L2:/i.test(decoded)) {
    return `kosher-${slug}`
  }

  return handle
}

export function buildProductBreadcrumbs(
  collection?: { title: string; handle: string } | null,
  countryCode?: string,
  // Kept for call-site compatibility. Categories are intentionally ignored
  // until the storefront has a real /categories/[handle] route.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categories?: ProductCategory[] | null
): BreadcrumbItem[] {
  const prefix = countryCode ? `/${countryCode}` : ""
  const items: BreadcrumbItem[] = [{ name: "Home", href: prefix || "/" }]

  if (collection) {
    items.push({
      name: collection.title,
      href: `${prefix}/collections/${normalizeCollectionHandle(collection.handle)}`,
    })
  }

  return items
}


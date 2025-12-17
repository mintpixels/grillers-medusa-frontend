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

      {/* Visual Breadcrumb Navigation */}
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
          <li>
            <span className="text-Charcoal font-medium" aria-current="page">
              {currentPage}
            </span>
          </li>
        </ol>
      </nav>
    </>
  )
}

// Helper function to build breadcrumb items for product pages
export function buildProductBreadcrumbs(
  collection?: { title: string; handle: string } | null,
  countryCode?: string
): BreadcrumbItem[] {
  const prefix = countryCode ? `/${countryCode}` : ""
  const items: BreadcrumbItem[] = [{ name: "Home", href: prefix || "/" }]

  if (collection) {
    items.push({
      name: collection.title,
      href: `${prefix}/collections/${collection.handle}`,
    })
  }

  return items
}


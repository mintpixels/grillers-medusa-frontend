import { Metadata } from "next"
import Link from "next/link"
import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"

export const metadata: Metadata = {
  title: "Site Navigation | Grillers Pride",
  description: "Browse all products and collections on Grillers Pride",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function NavigationPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { tab = "products" } = await searchParams

  const [productsData, collectionsData] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: { limit: 500 },
    }),
    listCollections({ limit: "500" }),
  ])

  const products = productsData.response.products
  const collections = collectionsData.collections

  const tabs = [
    { id: "products", label: "Products", count: products.length },
    { id: "collections", label: "Collections", count: collections.length },
  ]

  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <h1 className="font-rexton text-h2-mobile md:text-h2 text-Charcoal uppercase mb-2">
          Site Navigation
        </h1>
        <p className="text-p-md text-Smoke">
          Quick reference for all products and collections
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-SilverPlate mb-6">
        <nav className="flex gap-0 -mb-px" aria-label="Navigation tabs">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/${countryCode}/navigation?tab=${t.id}`}
              className={`px-6 py-3 text-p-md font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-Gold text-Charcoal"
                  : "border-transparent text-Smoke hover:text-Charcoal hover:border-Pewter"
              }`}
            >
              {t.label}
              <span className={`ml-2 text-p-sm ${
                tab === t.id ? "text-Gold" : "text-Pewter"
              }`}>
                ({t.count})
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-SilverPlate rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-Scroll">
            <tr>
              <th className="px-6 py-4 text-left text-p-sm-bold uppercase tracking-wider text-Charcoal">
                Name
              </th>
              <th className="px-6 py-4 text-left text-p-sm-bold uppercase tracking-wider text-Charcoal">
                URL
              </th>
              {tab === "products" && (
                <th className="px-6 py-4 text-left text-p-sm-bold uppercase tracking-wider text-Charcoal">
                  Status
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-SilverPlate">
            {tab === "products" && products.map((product) => {
              const url = `/${countryCode}/products/${product.handle}`
              return (
                <tr key={product.id} className="hover:bg-Scroll/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-p-md text-Charcoal font-medium">
                      {product.title}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={url}
                      className="text-p-sm text-IsraelBlue hover:text-Gold underline transition-colors"
                      target="_blank"
                    >
                      {url}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-p-ex-sm-mono rounded ${
                      product.status === "published"
                        ? "bg-Teal/20 text-Teal"
                        : "bg-Pewter/20 text-Smoke"
                    }`}>
                      {product.status || "published"}
                    </span>
                  </td>
                </tr>
              )
            })}

            {tab === "collections" && collections.map((collection) => {
              const url = `/${countryCode}/collections/${collection.handle}`
              return (
                <tr key={collection.id} className="hover:bg-Scroll/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-p-md text-Charcoal font-medium">
                      {collection.title}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={url}
                      className="text-p-sm text-IsraelBlue hover:text-Gold underline transition-colors"
                      target="_blank"
                    >
                      {url}
                    </Link>
                  </td>
                </tr>
              )
            })}

            {/* Empty State */}
            {((tab === "products" && products.length === 0) ||
              (tab === "collections" && collections.length === 0)) && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-Smoke">
                  No {tab} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 flex flex-wrap gap-4 text-p-sm text-Smoke">
        <span>
          Total: {tab === "products" ? products.length : collections.length} items
        </span>
        <span>-</span>
        <span>
          Base URL: /{countryCode}
        </span>
      </div>
    </div>
  )
}

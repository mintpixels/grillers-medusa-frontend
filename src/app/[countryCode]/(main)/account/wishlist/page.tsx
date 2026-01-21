import { Metadata } from "next"
import { getWishlist } from "@lib/data/wishlist"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import WishlistButton from "@modules/products/components/wishlist-button"
import Image from "next/image"

export const metadata: Metadata = {
  title: "My Wishlist | Grillers Pride",
  description: "View and manage your saved products.",
}

export default async function WishlistPage() {
  const wishlist = await getWishlist()

  return (
    <div className="py-8 md:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="text-h2 font-gyst text-Charcoal mb-8">My Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-Charcoal/30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="text-h4 font-gyst text-Charcoal mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-p-md font-maison-neue text-Charcoal/70 mb-8">
              Save products you love by clicking the heart icon on any product.
            </p>
            <LocalizedClientLink
              href="/store"
              className="inline-block bg-Gold hover:bg-Gold/90 text-Charcoal font-maison-neue font-bold text-p-md px-8 py-4 rounded-[5px] uppercase tracking-wide transition-colors"
            >
              Browse Products
            </LocalizedClientLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.productId}
                className="bg-white border border-Charcoal/10 rounded-[5px] overflow-hidden group"
              >
                <LocalizedClientLink
                  href={`/products/${item.productHandle}`}
                  className="block aspect-square relative bg-gray-100"
                >
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-Charcoal/30">
                      <svg
                        className="w-12 h-12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </LocalizedClientLink>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <LocalizedClientLink
                      href={`/products/${item.productHandle}`}
                      className="flex-1"
                    >
                      <h3 className="text-p-md font-maison-neue font-semibold text-Charcoal line-clamp-2 hover:underline">
                        {item.title}
                      </h3>
                    </LocalizedClientLink>
                    <WishlistButton
                      productId={item.productId}
                      productHandle={item.productHandle}
                      title={item.title}
                      thumbnail={item.thumbnail}
                      initialWishlisted={true}
                      variant="icon"
                    />
                  </div>
                  <p className="text-p-sm font-maison-neue text-Charcoal/60 mt-2">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"

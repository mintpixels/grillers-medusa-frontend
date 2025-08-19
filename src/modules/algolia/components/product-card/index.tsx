import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type { StrapiProductData } from "types/strapi"

const ProductCard = ({ hit }: { hit: StrapiProductData }) => (
  <article>
    <LocalizedClientLink
      href={`/products/${hit?.MedusaProduct?.Handle}`}
      className=""
    >
      <figure className="relative w-full aspect-square bg-gray-50">
        <Image
          src={hit?.FeaturedImage?.url ?? "https://placehold.co/400x400"}
          alt={hit.Title}
          fill
          className="object-cover"
        />
      </figure>

      <div className="py-8">
        <h4
          id={`hit-${hit.id}-title`}
          className="text-h4 font-gyst font-bold text-Charcoal pb-3 border-b border-Charcoal"
        >
          {hit.Title}
        </h4>
        {hit?.MedusaProduct?.Variants?.[0]?.Price?.CalculatedPriceNumber && (
          <p className="text-Charcoal py-7 border-b border-Charcoal">
            <span className="text-h3 font-gyst">
              ${hit.MedusaProduct.Variants[0].Price.CalculatedPriceNumber}
            </span>{" "}
            <span className="text-p-sm-mono font-maison-neue-mono uppercase ml-2">
              per lb
            </span>
          </p>
        )}
        {hit?.MedusaProduct?.Description && (
          <p className="text-p-sm font-maison-neue text-black py-6">
            {hit.MedusaProduct.Description}
          </p>
        )}

        <p className="inline-flex gap-3 pt-3">
          <span className="text-Charcoal font-rexton text-h6 font-bold uppercase">
            View Details
          </span>
          <Image
            src={"/images/icons/arrow-right.svg"}
            width={20}
            height={12}
            alt="view details"
          />
        </p>
      </div>
    </LocalizedClientLink>
  </article>
)

export default ProductCard

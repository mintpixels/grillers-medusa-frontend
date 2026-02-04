import Image from "next/image"
import Link from "next/link"
import { ProductCollectionData } from "@lib/data/strapi/collections"

type CollectionHeroProps = {
  collection: ProductCollectionData
  countryCode: string
}

export default function CollectionHero({ collection, countryCode }: CollectionHeroProps) {
  const hasHeroImage = Boolean(collection.HeroImage?.url)
  const hasDescription = Boolean(collection.Description)

  // If no hero image and no description, return minimal header
  if (!hasHeroImage && !hasDescription) {
    return (
      <div className="bg-Cream pt-12">
        <div className="content-container">
          <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal text-center">
            {collection.Name}
          </h1>
        </div>
      </div>
    )
  }

  // Hero with image
  if (hasHeroImage) {
    return (
      <div className="relative w-full h-[300px] md:h-[400px] mb-8 overflow-hidden">
        {/* Background Image */}
        <Image
          src={collection.HeroImage!.url}
          alt={collection.HeroImageAlt || collection.Name}
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-Charcoal/40" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="content-container text-center">
            <h1 className="text-h2-mobile md:text-h2 font-gyst text-white mb-4">
              {collection.Name}
            </h1>
            
            {hasDescription && (
              <p className="text-p-lg text-white/90 max-w-5xl mx-auto text-balance">
                {collection.Description}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Description without hero image
  return (
    <div className="bg-Cream pt-12">
      <div className="content-container text-center">
        <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal mb-4">
          {collection.Name}
        </h1>
        
        {hasDescription && (
          <p className="text-p-lg text-Charcoal/80 max-w-5xl mx-auto text-balance">
            {collection.Description}
          </p>
        )}
      </div>
    </div>
  )
}



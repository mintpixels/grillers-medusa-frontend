import React from "react"
import { default as NextImage } from "next/image"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
type Recipe = {
  Title: string
  ShortDescription: string
  Image: {
    url: string
  }
  Content: any
}

const RecipeTemplate = ({ recipe }: { recipe: Recipe }) => {
  const { Title, ShortDescription, Image, Content } = recipe
  return (
    <section className="py-10 md:py-16 bg-Scroll">
      <div className="mx-auto max-w-7xl px-4.5">
        <article className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-12">
            <div>
              <h1 className="text-h2 font-gyst text-Charcoal mb-4">{Title}</h1>
              <p className="text-p-md font-maison-neue text-Charcoal mb-6">
                {ShortDescription}
              </p>
              <div>
                {Image?.url && (
                  <NextImage
                    src={Image.url}
                    alt={Title}
                    width={500}
                    height={750}
                    className="size-full object-cover rounded-lg mb-6"
                  />
                )}
              </div>
            </div>
            <div className="prose max-w-none text-p-md font-maison-neue text-Charcoal">
              <BlocksRenderer content={Content} />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default RecipeTemplate

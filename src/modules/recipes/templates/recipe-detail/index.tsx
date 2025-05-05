import React from "react"
import NextImage from "next/image"

type Recipe = {
  Title: string
  Slug: string
  ShortDescription?: string
  Image?: { url: string }
  PublishedDate: string
  Servings: string
  PrepTime: string
  CookTime: string
  TotalTime: string
  Ingredients: { id: number; ingredient: string }[]
  Steps: { id: number; instruction: string }[]
}

const RecipeTemplate = ({ recipe }: { recipe: Recipe }) => {
  const {
    Title,
    ShortDescription,
    PublishedDate,
    PrepTime,
    CookTime,
    TotalTime,
    Servings,
    Ingredients,
    Steps,
    Image,
  } = recipe

  return (
    <section className="py-10 md:py-16 bg-white text-Charcoal">
      <div className="mx-auto max-w-4xl px-4">
        <article className="space-y-12">
          {/* Header */}
          <header>
            <h1 className="text-h2 font-gyst text-Charcoal">{Title}</h1>
            <p className="mt-1 text-p-md font-maison-neue text-Charcoal/80">
              Published {new Date(PublishedDate).toLocaleDateString()}
            </p>
            {ShortDescription && (
              <p className="mt-6 text-p-lg font-maison-neue text-Charcoal">
                {ShortDescription}
              </p>
            )}
          </header>

          {/* Image */}
          {Image?.url && (
            <div className="w-full aspect-[3/2] relative rounded-[5px] overflow-hidden shadow-sm">
              <NextImage
                src={Image.url}
                alt={`Image of ${Title}`}
                fill
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Stats */}
          <section aria-label="Recipe timing and serving info">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-Charcoal py-4 text-center">
              {[
                { label: "Total Time", value: TotalTime },
                { label: "Prep Time", value: PrepTime },
                { label: "Cook Time", value: CookTime },
                { label: "Servings", value: Servings },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-p-sm-mono font-maison-neue font-bold uppercase text-Charcoal">
                    {item.label}
                  </p>
                  <p className="text-p-sm-mono font-maison-neue-mono text-Charcoal">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Ingredients */}
          <section aria-labelledby="ingredients-heading">
            <h2
              id="ingredients-heading"
              className="text-h3 font-gyst text-Charcoal mb-6"
            >
              Ingredients
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              {Ingredients.map((item) => (
                <li
                  key={item.id}
                  className="text-p-md font-maison-neue text-Charcoal"
                >
                  {item.ingredient}
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section aria-labelledby="steps-heading">
            <h2
              id="steps-heading"
              className="text-h3 font-gyst text-Charcoal mb-6"
            >
              Preparation
            </h2>

            <dl className="space-y-8">
              {Steps?.map((step, index) => (
                <div key={step.id} className="">
                  <dt className="text-h4 font-gyst font-bold text-Charcoal pb-2">
                    Step {index + 1}:
                  </dt>
                  <dd className="text-p-md font-maison-neue text-Charcoal">
                    {step.instruction}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </article>
      </div>
    </section>
  )
}

export default RecipeTemplate

import { ChevronDown } from "lucide-react"
import type { IngredientDisclosure } from "types/strapi"

type IngredientDisclosureProps = {
  disclosures?: IngredientDisclosure[] | null
  selectedSku?: string | null
}

type DisclosureContent = {
  ingredients: string
  contains?: string
  directions?: string
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

function normalizeSku(value?: string | null) {
  return normalizeText(value).toUpperCase()
}

function stripLeadingLabel(value: string, label: string) {
  return value.replace(new RegExp(`^${label}:\\s*`, "i"), "").trim()
}

function hasCustomerFacingContent(disclosure: IngredientDisclosure) {
  return Boolean(
    normalizeText(disclosure.Ingredients) ||
      normalizeText(disclosure.Contains) ||
      normalizeText(disclosure.Directions)
  )
}

function isApproved(disclosure: IngredientDisclosure) {
  return disclosure.ReviewStatus === "approved"
}

export function selectIngredientDisclosure(
  disclosures?: IngredientDisclosure[] | null,
  selectedSku?: string | null
) {
  const approved = (disclosures || []).filter(
    (disclosure) => isApproved(disclosure) && hasCustomerFacingContent(disclosure)
  )
  if (approved.length === 0) return null

  const sku = normalizeSku(selectedSku)
  if (sku) {
    const exactMatch = approved.find(
      (disclosure) => normalizeSku(disclosure.Sku) === sku
    )
    if (exactMatch) return exactMatch
  }

  const globalDisclosure = approved.find(
    (disclosure) => !normalizeSku(disclosure.Sku)
  )
  if (globalDisclosure) return globalDisclosure

  return approved.length === 1 ? approved[0] : null
}

export function buildIngredientDisclosureContent(
  disclosure: IngredientDisclosure | null
): DisclosureContent | null {
  if (!disclosure) return null

  let ingredients = stripLeadingLabel(
    normalizeText(disclosure.Ingredients),
    "Ingredients"
  )
  let contains = stripLeadingLabel(normalizeText(disclosure.Contains), "Contains")
  const directions = normalizeText(disclosure.Directions).replace(
    /^(Heating Instructions|Cooking Instructions|Directions):\s*/i,
    ""
  )

  if (!contains) {
    const containsMatch = ingredients.match(/\bContains:\s*(.+)$/i)
    if (
      typeof containsMatch?.index === "number" &&
      containsMatch.index > 0 &&
      containsMatch[1]
    ) {
      contains = containsMatch[1].trim()
      ingredients = ingredients
        .slice(0, containsMatch.index)
        .replace(/[.;,\s]+$/g, "")
        .trim()
    }
  }

  if (!ingredients && !contains && !directions) return null

  const content: DisclosureContent = { ingredients }
  if (contains) content.contains = contains
  if (directions) content.directions = directions

  return content
}

export default function ProductIngredientDisclosures({
  disclosures,
  selectedSku,
}: IngredientDisclosureProps) {
  const disclosure = selectIngredientDisclosure(disclosures, selectedSku)
  const content = buildIngredientDisclosureContent(disclosure)

  if (!content) return null

  return (
    <section
      aria-labelledby="ingredient-disclosure-heading"
      className="mb-6 border-y border-Charcoal/15 py-5"
    >
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <h2
            id="ingredient-disclosure-heading"
            className="font-maison-neue-mono text-p-sm-mono font-bold uppercase text-Charcoal"
          >
            Ingredients
          </h2>
          <ChevronDown
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-Charcoal/65 transition-transform duration-200 group-open:rotate-180"
            strokeWidth={1.75}
          />
        </summary>

        <div className="mt-4 space-y-4 font-maison-neue text-sm leading-relaxed text-Charcoal/80">
          {content.ingredients && <p>{content.ingredients}</p>}

          {content.contains && (
            <p>
              <span className="font-bold text-Charcoal">Contains: </span>
              {content.contains}
            </p>
          )}

          {content.directions && (
            <div className="border-t border-Charcoal/10 pt-4">
              <h3 className="font-maison-neue text-sm font-bold text-Charcoal">
                Heating instructions
              </h3>
              <p className="mt-2">{content.directions}</p>
            </div>
          )}
        </div>
      </details>
    </section>
  )
}

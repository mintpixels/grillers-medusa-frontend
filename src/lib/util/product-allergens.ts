import type { IngredientDisclosure } from "types/strapi"

export const FDA_MAJOR_ALLERGENS = [
  { key: "milk", label: "Milk" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "shellfish", label: "Shellfish" },
  { key: "tree_nuts", label: "Tree Nuts" },
  { key: "peanuts", label: "Peanuts" },
  { key: "wheat", label: "Wheat" },
  { key: "soybeans", label: "Soybeans" },
  { key: "sesame", label: "Sesame" },
] as const

export type AllergenKey = (typeof FDA_MAJOR_ALLERGENS)[number]["key"]

type ProductWithIngredientDisclosures = {
  IngredientDisclosures?: IngredientDisclosure[] | null
}

const ALLERGEN_LABEL_BY_KEY = new Map<AllergenKey, string>(
  FDA_MAJOR_ALLERGENS.map((allergen) => [allergen.key, allergen.label])
)

const ALLERGEN_MATCHERS: Record<AllergenKey, RegExp[]> = {
  milk: [
    /\bmilk\b/i,
    /\bdairy\b/i,
    /\bbutter\b/i,
    /\bcream\b/i,
    /\bcheese\b/i,
    /\bwhey\b/i,
    /\bcasein(?:ate)?\b/i,
    /\blactose\b/i,
  ],
  eggs: [/\beggs?\b/i, /\balbum[ei]n\b/i],
  fish: [
    /\bfish\b/i,
    /\bsalmon\b/i,
    /\btuna\b/i,
    /\bcod\b/i,
    /\btilapia\b/i,
    /\banchov(?:y|ies)\b/i,
    /\bsardines?\b/i,
    /\bhalibut\b/i,
    /\btrout\b/i,
  ],
  shellfish: [
    /\bshellfish\b/i,
    /\bcrustaceans?\b/i,
    /\bshrimp\b/i,
    /\bcrab\b/i,
    /\blobster\b/i,
    /\bcrawfish\b/i,
    /\bcrayfish\b/i,
    /\bscallops?\b/i,
    /\bclams?\b/i,
    /\boysters?\b/i,
    /\bmussels?\b/i,
  ],
  tree_nuts: [
    /\btree nuts?\b/i,
    /\balmonds?\b/i,
    /\bwalnuts?\b/i,
    /\bpecans?\b/i,
    /\bcashews?\b/i,
    /\bpistachios?\b/i,
    /\bhazelnuts?\b/i,
    /\bmacadamias?\b/i,
    /\bbrazil nuts?\b/i,
    /\bpine nuts?\b/i,
    /\bcoconuts?\b/i,
  ],
  peanuts: [/\bpeanuts?\b/i, /\bgroundnuts?\b/i],
  wheat: [
    /\bwheat\b/i,
    /\bwheat flour\b/i,
    /\bflour\b/i,
    /\bpanko\b/i,
    /\bmatz[ao]h?\b/i,
    /\bgluten\b/i,
  ],
  soybeans: [
    /\bsoy\b/i,
    /\bsoybeans?\b/i,
    /\bsoya\b/i,
    /\bedamame\b/i,
    /\btofu\b/i,
    /\bsoy lecithin\b/i,
    /\bsoybean oil\b/i,
    /\bhydrol(?:y|i)zed soy protein\b/i,
  ],
  sesame: [/\bsesame\b/i, /\btahini\b/i],
}

function normalizeDisclosureText(value?: string | null) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

export function isApprovedIngredientDisclosure(
  disclosure: IngredientDisclosure
) {
  return (
    disclosure.ReviewStatus === "approved" &&
    Boolean(
      normalizeDisclosureText(disclosure.Contains) ||
        normalizeDisclosureText(disclosure.Ingredients)
    )
  )
}

export function allergenLabelForKey(key: AllergenKey) {
  return ALLERGEN_LABEL_BY_KEY.get(key) || key
}

export function detectAllergensInText(text: string): AllergenKey[] {
  const found: AllergenKey[] = []

  for (const allergen of FDA_MAJOR_ALLERGENS) {
    if (ALLERGEN_MATCHERS[allergen.key].some((matcher) => matcher.test(text))) {
      found.push(allergen.key)
    }
  }

  return found
}

export function getProductAllergenKeys(
  product: ProductWithIngredientDisclosures
): AllergenKey[] {
  const disclosures = (product.IngredientDisclosures || []).filter(
    isApprovedIngredientDisclosure
  )
  if (disclosures.length === 0) return []

  const found = new Set<AllergenKey>()

  for (const disclosure of disclosures) {
    const text = [
      normalizeDisclosureText(disclosure.Contains),
      normalizeDisclosureText(disclosure.Ingredients),
    ]
      .filter(Boolean)
      .join(" ")

    for (const allergen of detectAllergensInText(text)) {
      found.add(allergen)
    }
  }

  return Array.from(found)
}

export function hasApprovedIngredientDisclosure(
  product: ProductWithIngredientDisclosures
) {
  return (product.IngredientDisclosures || []).some(isApprovedIngredientDisclosure)
}

export function productContainsAnyAllergen(
  product: ProductWithIngredientDisclosures,
  allergens: AllergenKey[]
) {
  if (allergens.length === 0) return false

  const found = getProductAllergenKeys(product)
  if (found.length === 0) return false

  return allergens.some((allergen) => found.includes(allergen))
}

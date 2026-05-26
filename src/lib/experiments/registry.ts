import type { ExperimentDefinition } from "./types"

export const EXPERIMENT_DEFINITIONS: ExperimentDefinition[] = [
  {
    key: "homepage_shopping_flow_v1",
    surface: "homepage",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "homepage_shopping_flow_v1",
    description:
      "Homepage ordering and early product visibility. Control is the current production homepage.",
    variants: [
      { key: "control", label: "Current homepage" },
      {
        key: "products_earlier",
        label: "Products earlier",
        description:
          "Moves product shopping modules higher while preserving brand and learning context.",
      },
      {
        key: "compressed_story",
        label: "Compressed story",
        description:
          "Keeps the same modules but reduces pre-product vertical distance.",
      },
    ],
  },
  {
    key: "pdp_at_a_glance_v1",
    surface: "pdp",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "pdp_at_a_glance_v1",
    description:
      "PDP facts and detail density. Control is the current production PDP.",
    variants: [
      { key: "control", label: "Current PDP" },
      {
        key: "collapsed_details",
        label: "Collapsed details",
        description:
          "Prioritizes at-a-glance purchase facts and moves secondary details behind disclosure.",
      },
    ],
  },
  {
    key: "navigation_ways_to_shop_v1",
    surface: "navigation",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "navigation_ways_to_shop_v1",
    description:
      "Top-level navigation and Ways to Shop entry points. Control is the current production nav.",
    variants: [
      { key: "control", label: "Current navigation" },
      {
        key: "top_level_ways_to_shop",
        label: "Top-level Ways to Shop",
        description:
          "Promotes Ways to Shop as a primary entry point with links to filtered hub views.",
      },
    ],
  },
  {
    key: "plp_merchandising_v1",
    surface: "plp",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "plp_merchandising_v1",
    description:
      "Collection/listing merchandising modules. Control is the current production PLP.",
    variants: [
      { key: "control", label: "Current PLP" },
      {
        key: "contextual_merchandising",
        label: "Contextual merchandising",
        description:
          "Adds concise collection context and shopping guidance above product grids.",
      },
    ],
  },
  {
    key: "search_merchandising_v1",
    surface: "search",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "search_merchandising_v1",
    description:
      "Search and no-results merchandising. Control is the current production search experience.",
    variants: [
      { key: "control", label: "Current search" },
      {
        key: "guided_no_results",
        label: "Guided no-results",
        description:
          "Adds helpful recovery paths for searches with sparse or missing results.",
      },
    ],
  },
  {
    key: "recipes_entrypoints_v1",
    surface: "recipes",
    impact: "non_revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "recipes_entrypoints_v1",
    description:
      "Recipe hub entry point structure. Control is the current production recipe hub.",
    variants: [
      { key: "control", label: "Current recipes hub" },
      {
        key: "shopping_paths",
        label: "Shopping paths",
        description:
          "Routes Ways to Shop traffic into recipe-filtered shopping use cases.",
      },
    ],
  },
  {
    key: "learn_entrypoints_v1",
    surface: "learn",
    impact: "non_revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "learn_entrypoints_v1",
    description:
      "Learning hub entry point structure. Control is the current production learning hub.",
    variants: [
      { key: "control", label: "Current learning hub" },
      {
        key: "occasion_guidance",
        label: "Occasion guidance",
        description:
          "Groups learning links by buying and preparation jobs instead of generic topics.",
      },
    ],
  },
  {
    key: "collections_entrypoints_v1",
    surface: "collections",
    impact: "non_revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "collections_entrypoints_v1",
    description:
      "Collections hub entry point structure. Control is the current production collections hub.",
    variants: [
      { key: "control", label: "Current collections hub" },
      {
        key: "shop_by_need",
        label: "Shop by need",
        description:
          "Organizes collections around customer buying jobs and fulfillment constraints.",
      },
    ],
  },
  {
    key: "cart_upsell_strategy_v1",
    surface: "cart",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "cart_upsell_strategy_v1",
    description:
      "Cart upsell density and prioritization. Control is the current cart and side-cart recommendation rail.",
    variants: [
      { key: "control", label: "Current upsells" },
      {
        key: "focused_pair",
        label: "Focused pair",
        description:
          "Shows fewer, higher-intent additions so the cart stays focused on checkout.",
      },
    ],
  },
  {
    key: "pdp_recommendation_strategy_v1",
    surface: "pdp_recommendations",
    impact: "revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "pdp_recommendation_strategy_v1",
    description:
      "PDP bundle and cross-sell presentation. Control is the current curated collection block.",
    variants: [
      { key: "control", label: "Current bundles" },
      {
        key: "single_best_match",
        label: "Single best match",
        description:
          "Surfaces only the strongest matched collection to reduce post-buybox decision load.",
      },
    ],
  },
  {
    key: "newsletter_capture_v1",
    surface: "newsletter",
    impact: "non_revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "newsletter_capture_v1",
    description:
      "Newsletter capture timing and copy. Control is the current production capture surface.",
    variants: [
      { key: "control", label: "Current capture" },
      {
        key: "shopping_job_prompt",
        label: "Shopping job prompt",
        description:
          "Frames signup around restock, holiday, and cooking planning needs.",
      },
    ],
  },
  {
    key: "seo_geo_landing_copy_v1",
    surface: "seo_geo",
    impact: "non_revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "seo_geo_landing_copy_v1",
    description:
      "SEO/GEO page copy structure for answer-engine and search landing pages.",
    variants: [
      { key: "control", label: "Current landing copy" },
      {
        key: "answer_first",
        label: "Answer-first copy",
        description:
          "Starts pages with concise customer answers before deeper merchandising content.",
      },
    ],
  },
  {
    key: "reviews_proof_v1",
    surface: "reviews",
    impact: "non_revenue",
    status: "paused",
    defaultVariant: "control",
    statsigExperiment: "reviews_proof_v1",
    description:
      "Review and proof placement once verified customer review data is available.",
    variants: [
      { key: "control", label: "Current proof" },
      {
        key: "verified_near_cta",
        label: "Verified near CTA",
        description:
          "Moves verified, product-relevant proof closer to buying decisions.",
      },
    ],
  },
]

const EXPERIMENTS_BY_KEY = new Map(
  EXPERIMENT_DEFINITIONS.map((definition) => [definition.key, definition])
)

export function listExperimentDefinitions() {
  return EXPERIMENT_DEFINITIONS
}

export function getExperimentDefinition(key: string) {
  return EXPERIMENTS_BY_KEY.get(key)
}

export function isKnownVariant(
  definition: ExperimentDefinition,
  variantKey: string | null | undefined
) {
  return Boolean(
    variantKey && definition.variants.some((variant) => variant.key === variantKey)
  )
}

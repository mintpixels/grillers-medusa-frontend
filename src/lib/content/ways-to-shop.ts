export type CollectionOccasion =
  | "starter"
  | "shabbos"
  | "weeknight"
  | "holiday"
  | "grilling"
  | "premium"
  | "heritage"
  | "prepared"
  | "stock_up"
  | "cart_upsell"
  | "other"

export type RecipeMissionBucket =
  | "shabbos-table"
  | "weeknight-dinner"
  | "yom-tov-passover"
  | "kfp-briskets-roasts"
  | "whole-birds"
  | "steaks-chops"
  | "butchers-picks"

export type WaysToShopMissionId =
  | "first-order"
  | "shabbos"
  | "weeknight"
  | "freezer-stock-up"
  | "grilling"
  | "holiday-table"
  | "premium-specialty"
  | "kashruth-confidence"

export type WaysToShopLearnLink = {
  title: string
  body: string
  href: string
  cta: string
}

export type WaysToShopMission = {
  id: WaysToShopMissionId
  label: string
  navLabel: string
  eyebrow: string
  description: string
  collectionOccasions: CollectionOccasion[]
  recipeBucket: RecipeMissionBucket
  shopHref: string
  cookHref: string
  learnHref: string
  learnLinks: WaysToShopLearnLink[]
}

export const WAYS_TO_SHOP_MISSIONS: WaysToShopMission[] = [
  {
    id: "first-order",
    label: "First order",
    navLabel: "First order",
    eyebrow: "Start here",
    description:
      "Dependable proteins, prepared helpers, and simple planning guides for building a kosher cart without overbuying.",
    collectionOccasions: ["starter", "cart_upsell"],
    recipeBucket: "weeknight-dinner",
    shopHref: "/collections?mission=first-order#collections-results",
    cookHref: "/recipes?mission=first-order#recipes-results",
    learnHref: "/learn?mission=first-order#learning-path",
    learnLinks: [
      {
        title: "Start with the product page",
        body: "Know what to check before adding raw cuts, prepared items, or Passover-sensitive products.",
        href: "/learn/kosher-meat-101#product-page",
        cta: "Read the basics",
      },
      {
        title: "How much meat should I buy?",
        body: "Use portion guidance to build a complete order without guessing at quantities.",
        href: "/learn/guides/how-much-meat-per-person",
        cta: "Read portion guide",
      },
      {
        title: "Build a Shabbos order",
        body: "See how proteins, prepared sides, soup bones, and easy reorders can fit together.",
        href: "/learn/guides/shabbos-meat-order",
        cta: "Plan the basket",
      },
    ],
  },
  {
    id: "shabbos",
    label: "Shabbos table",
    navLabel: "Shabbos",
    eyebrow: "Make ahead",
    description:
      "Mains, soup cuts, prepared helpers, and recipes that hold up for Friday night or Shabbos lunch.",
    collectionOccasions: ["shabbos", "prepared"],
    recipeBucket: "shabbos-table",
    shopHref: "/collections?mission=shabbos#collections-results",
    cookHref: "/recipes?mission=shabbos#recipes-results",
    learnHref: "/learn?mission=shabbos#learning-path",
    learnLinks: [
      {
        title: "Build a Shabbos order",
        body: "Plan a balanced basket across protein, prepared sides, soup bones, deli, and easy reorders.",
        href: "/learn/guides/shabbos-meat-order",
        cta: "Plan Shabbos",
      },
      {
        title: "Best cuts for slow cooking",
        body: "Find braises, roasts, shanks, cheeks, ribs, and cuts that reward patience.",
        href: "/learn/guides/best-cuts-for-slow-cooking",
        cta: "Read slow-cook guide",
      },
      {
        title: "Brisket first cut, deckel, or whole?",
        body: "Compare fat, tenderness, slicing, cook time, and holiday fit.",
        href: "/learn/guides/brisket-first-cut-deckel-whole",
        cta: "Compare brisket",
      },
    ],
  },
  {
    id: "weeknight",
    label: "Weeknight dinner",
    navLabel: "Weeknight",
    eyebrow: "Fast wins",
    description:
      "Quick-searing cuts, cutlets, burgers, and prepared options for getting real dinner onto the table.",
    collectionOccasions: ["weeknight", "prepared"],
    recipeBucket: "weeknight-dinner",
    shopHref: "/collections?mission=weeknight#collections-results",
    cookHref: "/recipes?mission=weeknight#recipes-results",
    learnHref: "/learn?mission=weeknight#learning-path",
    learnLinks: [
      {
        title: "Single-ingredient cuts are simpler",
        body: "Understand when raw cuts are straightforward and when prepared items need closer label review.",
        href: "/learn/kosher-meat-101#raw-vs-prepared",
        cta: "Learn the difference",
      },
      {
        title: "How much meat should I buy?",
        body: "Size weeknight meals, leftovers, and mixed menus with clearer portions.",
        href: "/learn/guides/how-much-meat-per-person",
        cta: "Read portion guide",
      },
      {
        title: "Poultry cut guide",
        body: "Compare cutlets, thighs, wings, drumsticks, whole birds, turkey, duck, and capon.",
        href: "/learn/cuts/poultry",
        cta: "Learn poultry cuts",
      },
    ],
  },
  {
    id: "freezer-stock-up",
    label: "Freezer stock-up",
    navLabel: "Freezer",
    eyebrow: "Order ahead",
    description:
      "Versatile proteins, bulk-friendly paths, and thawing guidance for reliable meals between orders.",
    collectionOccasions: ["stock_up", "starter", "cart_upsell"],
    recipeBucket: "shabbos-table",
    shopHref: "/collections?mission=freezer-stock-up#collections-results",
    cookHref: "/recipes?mission=freezer-stock-up#recipes-results",
    learnHref: "/learn?mission=freezer-stock-up#learning-path",
    learnLinks: [
      {
        title: "Frozen delivery and thawing",
        body: "What to do when a dry-ice shipment arrives, how to store it, and how to thaw safely.",
        href: "/learn/guides/thawing-frozen-kosher-meat",
        cta: "Read thawing guide",
      },
      {
        title: "How much meat should I buy?",
        body: "Plan household quantities for freezer stock, leftovers, and larger meals.",
        href: "/learn/guides/how-much-meat-per-person",
        cta: "Read portion guide",
      },
      {
        title: "Best cuts for slow cooking",
        body: "Choose freezer-friendly roasts and braising cuts that can become full meals.",
        href: "/learn/guides/best-cuts-for-slow-cooking",
        cta: "Read slow-cook guide",
      },
    ],
  },
  {
    id: "grilling",
    label: "Grill night",
    navLabel: "Grill",
    eyebrow: "High heat",
    description:
      "Steaks, chops, burgers, boerewors, and grilling guidance for kosher cuts that need careful heat control.",
    collectionOccasions: ["grilling", "premium"],
    recipeBucket: "steaks-chops",
    shopHref: "/collections?mission=grilling#collections-results",
    cookHref: "/recipes?mission=grilling#recipes-results",
    learnHref: "/learn?mission=grilling#learning-path",
    learnLinks: [
      {
        title: "Best cuts for grilling",
        body: "Steaks, chops, boerewors, skirt, hanger, burgers, and how to avoid overcooking lean kosher cuts.",
        href: "/learn/guides/best-cuts-for-grilling",
        cta: "Read grill guide",
      },
      {
        title: "Beef cut guide",
        body: "Compare brisket, deckel, flanken, hanger, skirt, oyster steak, London broil, bones, cheek, and ground beef.",
        href: "/learn/cuts/beef",
        cta: "Learn beef cuts",
      },
      {
        title: "Prepared & Specialty",
        body: "Use specialty items like boerewors and biltong with clearer serving context.",
        href: "/learn/cuts/prepared-specialty",
        cta: "Learn specialties",
      },
    ],
  },
  {
    id: "holiday-table",
    label: "Holiday table",
    navLabel: "Holiday",
    eyebrow: "Hosting",
    description:
      "Centerpiece roasts, briskets, poultry, and Passover-aware planning for a bigger kosher table.",
    collectionOccasions: ["holiday", "premium", "prepared"],
    recipeBucket: "yom-tov-passover",
    shopHref: "/collections?mission=holiday-table#collections-results",
    cookHref: "/recipes?mission=holiday-table#recipes-results",
    learnHref: "/learn?mission=holiday-table#learning-path",
    learnLinks: [
      {
        title: "Kosher for Passover",
        body: "Understand KFP labels, prepared-for-Passover items, and the difference from year-round kosher status.",
        href: "/kashruth/passover",
        cta: "Read Passover guide",
      },
      {
        title: "Brisket first cut, deckel, or whole?",
        body: "Choose the brisket format that fits slicing, tenderness, cook time, and hosting style.",
        href: "/learn/guides/brisket-first-cut-deckel-whole",
        cta: "Compare brisket",
      },
      {
        title: "How much meat should I buy?",
        body: "Size a larger Yom Tov, Passover, or holiday table with portion guidance.",
        href: "/learn/guides/how-much-meat-per-person",
        cta: "Read portion guide",
      },
    ],
  },
  {
    id: "premium-specialty",
    label: "Premium & specialty",
    navLabel: "Specialty",
    eyebrow: "Butcher picks",
    description:
      "Harder-to-find cuts, lamb, veal, South African specialties, and butcher picks for shoppers ready to branch out.",
    collectionOccasions: ["premium", "heritage", "prepared"],
    recipeBucket: "butchers-picks",
    shopHref: "/collections?mission=premium-specialty#collections-results",
    cookHref: "/recipes?mission=premium-specialty#recipes-results",
    learnHref: "/learn?mission=premium-specialty#learning-path",
    learnLinks: [
      {
        title: "Prepared & Specialty",
        body: "Boerewors, biltong, droewors, corned beef, pastrami, pocket pies, kugels, and prepared sides.",
        href: "/learn/cuts/prepared-specialty",
        cta: "Learn specialties",
      },
      {
        title: "Lamb cut guide",
        body: "Compare racks, chops, shoulder, shanks, ground lamb, riblets, lollipop, and frenched cuts.",
        href: "/learn/cuts/lamb",
        cta: "Learn lamb cuts",
      },
      {
        title: "Veal cut guide",
        body: "Understand chops, scallopini, schnitzel, riblets, stew meat, and ground veal.",
        href: "/learn/cuts/veal",
        cta: "Learn veal cuts",
      },
    ],
  },
  {
    id: "kashruth-confidence",
    label: "Kashruth confidence",
    navLabel: "Kashruth",
    eyebrow: "Verify details",
    description:
      "Supervision, hechsher, and Passover guidance kept close to the shopping and cooking decisions.",
    collectionOccasions: ["holiday", "starter", "prepared"],
    recipeBucket: "kfp-briskets-roasts",
    shopHref: "/collections?mission=kashruth-confidence#collections-results",
    cookHref: "/recipes?mission=kashruth-confidence#recipes-results",
    learnHref: "/learn?mission=kashruth-confidence#learning-path",
    learnLinks: [
      {
        title: "Kashruth Supervision",
        body: "AKC supervision, every-shift mashgiach process, and direct verification details.",
        href: "/kashruth/supervision",
        cta: "Verify supervision",
      },
      {
        title: "Hechsherim",
        body: "How meat and poultry are tagged by certifying agency, community standard, and shchita detail.",
        href: "/kashruth/hechsherim",
        cta: "Read hechsher guide",
      },
      {
        title: "Kosher for Passover",
        body: "KFP labels, prepared-for-Passover items, and how year-round kosher status differs from Passover status.",
        href: "/kashruth/passover",
        cta: "Read Passover guide",
      },
    ],
  },
]

const MISSION_BY_ID = new Map(
  WAYS_TO_SHOP_MISSIONS.map((mission) => [mission.id, mission])
)

export function isWaysToShopMissionId(
  value?: string | null
): value is WaysToShopMissionId {
  return Boolean(value && MISSION_BY_ID.has(value as WaysToShopMissionId))
}

export function getWaysToShopMission(value?: string | null) {
  if (!isWaysToShopMissionId(value)) return null
  return MISSION_BY_ID.get(value) || null
}

export function isCollectionOccasion(
  value?: string | null
): value is CollectionOccasion {
  return Boolean(
    value &&
      [
        "starter",
        "shabbos",
        "weeknight",
        "holiday",
        "grilling",
        "premium",
        "heritage",
        "prepared",
        "stock_up",
        "cart_upsell",
        "other",
      ].includes(value)
  )
}

export function collectionOccasionsForMission(
  missionId?: string | null,
  fallbackOccasion?: string | null
) {
  const mission = getWaysToShopMission(missionId)
  if (mission) return mission.collectionOccasions
  if (isCollectionOccasion(fallbackOccasion)) return [fallbackOccasion]
  return []
}

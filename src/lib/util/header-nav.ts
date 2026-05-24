import type {
  HeaderNavLink,
  NavBottomBar,
  NavFeatured,
  NavItem,
  NavSection,
} from "@lib/data/strapi/header"
import { generatedSiteImages } from "@lib/content/generated-site-images"
import { WAYS_TO_SHOP_MISSIONS } from "@lib/content/ways-to-shop"

const FALLBACK_FEATURED_IMAGES: Record<string, string> = {
  "butcher-counter": generatedSiteImages.navButcherFeature,
  "deli-counter": generatedSiteImages.navDeliFeature,
  "kitchen-counter": generatedSiteImages.navKitchenFeature,
  provisions: generatedSiteImages.navProvisionsFeature,
}

const BEEF_TOP_CUTS: NavItem[] = [
  { Text: "Ribeye", Url: "/search?q=ribeye" },
  { Text: "Strip Steak", Url: "/search?q=strip%20steak" },
  { Text: "Filet", Url: "/search?q=filet" },
  { Text: "Brisket", Url: "/search?q=brisket" },
]

const WAYS_TO_SHOP_MENU_MISSIONS = WAYS_TO_SHOP_MISSIONS.slice(0, 8)

const WAYS_TO_SHOP_NAV_SECTIONS: NavSection[] = [
  {
    title: "Shop Collections",
    Url: "/collections",
    items: WAYS_TO_SHOP_MENU_MISSIONS.map((mission) => ({
      Text: mission.navLabel,
      Url: mission.shopHref,
    })),
  },
  {
    title: "Cook Recipes",
    Url: "/recipes",
    items: WAYS_TO_SHOP_MENU_MISSIONS.map((mission) => ({
      Text: mission.navLabel,
      Url: mission.cookHref,
    })),
  },
  {
    title: "Learn Before Ordering",
    Url: "/learn",
    items: WAYS_TO_SHOP_MENU_MISSIONS.map((mission) => ({
      Text: mission.navLabel,
      Url: mission.learnHref,
    })),
  },
]

const WAYS_TO_SHOP_NAV: HeaderNavLink = {
  id: "ways-to-shop",
  slug: "ways-to-shop",
  title: "Ways to Shop",
  sections: WAYS_TO_SHOP_NAV_SECTIONS,
  featured: {
    title: "Start with the meal, not just the cut",
    description:
      "Choose a shopping path, then move between collections, recipes, and buying guidance for the same meal.",
    badge: "Guided shopping",
    image: { url: generatedSiteImages.navButcherFeature },
    url: "/collections?mission=shabbos#collections-results",
  },
  bottomBar: {
    certifications: [
      { icon: "star", text: "Filtered collection paths" },
      { icon: "award", text: "Recipe shelves by mission" },
      { icon: "clock", text: "Buying guides before checkout" },
    ],
    viewAllText: "Open guided shopping",
    viewAllUrl: "/collections#collections-results",
  },
}

const FALLBACK_BOTTOM_BAR: NavBottomBar = {
  certifications: [
    { icon: "award", text: "Item-level hechsher details" },
    { icon: "clock", text: "Cold-chain checkout lanes" },
    { icon: "star", text: "Premium kosher cuts" },
  ],
  viewAllText: "View all products",
  viewAllUrl: "/store",
}

const FALLBACK_FEATURED: NavFeatured = {
  title: "Holiday and freezer-ready bundles",
  description:
    "Build a full kosher table with curated bundles, bulk packages, and premium beef cuts.",
  badge: "Seasonal picks",
  image: { url: generatedSiteImages.navButcherFeature },
  url: "/collections/rosh-hashanah-table",
}

const FALLBACK_NAV: HeaderNavLink[] = [
  {
    id: "shop",
    slug: "shop",
    title: "Shop",
    sections: [
      {
        title: "Beef",
        Url: "/collections/kosher-beef",
        items: BEEF_TOP_CUTS,
      },
      {
        title: "Proteins",
        Url: "/store",
        items: [
          { Text: "Chicken", Url: "/search?q=chicken" },
          { Text: "Lamb", Url: "/search?q=lamb" },
          { Text: "Rose Veal", Url: "/search?q=veal" },
          { Text: "Bones & Offal", Url: "/search?q=bones%20offal" },
        ],
      },
    ],
    featured: FALLBACK_FEATURED,
    bottomBar: FALLBACK_BOTTOM_BAR,
  },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeLabel(value: string) {
  const compact = slugify(value)
  if (
    compact === "offal-and-bones" ||
    compact === "offal-bones" ||
    compact === "bones-and-offal" ||
    compact === "bones-offal"
  ) {
    return "Bones & Offal"
  }
  return value
}

function itemExists(items: NavItem[], text: string) {
  const target = slugify(text)
  return items.some((item) => slugify(item.Text) === target)
}

function sectionExists(sections: NavSection[], title: string) {
  const target = slugify(title)
  return sections.some((section) => slugify(section.title) === target)
}

function isWaysToShopSection(section: NavSection) {
  return slugify(section.title) === "ways-to-shop"
}

function isWaysToShopLink(link: HeaderNavLink) {
  return (
    slugify(link.title) === "ways-to-shop" ||
    slugify(link.slug) === "ways-to-shop"
  )
}

function isPrimaryShopLink(link: HeaderNavLink) {
  if (isWaysToShopLink(link)) return false
  return /shop|butcher|meat|product|all/i.test(`${link.title} ${link.slug}`)
}

function moveWaysToShopBeforePrimaryShop(navLinks: HeaderNavLink[]) {
  const waysIndex = navLinks.findIndex(isWaysToShopLink)
  if (waysIndex < 0) return navLinks

  const primaryIndex = navLinks.findIndex(
    (link, index) => index !== waysIndex && isPrimaryShopLink(link)
  )

  if (primaryIndex < 0 || waysIndex < primaryIndex) {
    return navLinks
  }

  const waysToShop = navLinks[waysIndex]
  const withoutWays = navLinks.filter((_, index) => index !== waysIndex)
  const adjustedPrimaryIndex = withoutWays.findIndex(isPrimaryShopLink)

  if (adjustedPrimaryIndex < 0) {
    return navLinks
  }

  return [
    ...withoutWays.slice(0, adjustedPrimaryIndex),
    waysToShop,
    ...withoutWays.slice(adjustedPrimaryIndex),
  ]
}

function mergeItems(existing: NavItem[], required: NavItem[]) {
  const merged = [...existing]
  for (const item of required) {
    if (!itemExists(merged, item.Text)) {
      merged.push(item)
    }
  }
  return merged
}

function normalizeSection(section: NavSection): NavSection {
  return {
    ...section,
    title: normalizeLabel(section.title),
    items: (section.items || []).map((item) => ({
      ...item,
      Text: normalizeLabel(item.Text),
    })),
  }
}

function addPrimaryShopSections(sections: NavSection[]) {
  const next = sections
    .filter((section) => !isWaysToShopSection(section))
    .map((section) => {
      const normalized = normalizeSection(section)
      if (slugify(normalized.title) !== "beef") return normalized
      return {
        ...normalized,
        items: mergeItems(normalized.items || [], BEEF_TOP_CUTS),
      }
    })

  if (!sectionExists(next, "Beef")) {
    next.splice(1, 0, {
      title: "Beef",
      Url: "/collections/kosher-beef",
      items: BEEF_TOP_CUTS,
    })
  }

  return next
}

function featuredImageFallback(link: HeaderNavLink) {
  return (
    FALLBACK_FEATURED_IMAGES[link.slug] ||
    FALLBACK_FEATURED_IMAGES[slugify(link.title)] ||
    generatedSiteImages.navButcherFeature
  )
}

function featuredWithFallback(
  featured: NavFeatured | null | undefined,
  link: HeaderNavLink
) {
  return {
    ...FALLBACK_FEATURED,
    ...(featured || {}),
    image: featured?.image?.url
      ? featured.image
      : { url: featuredImageFallback(link) },
    url: featured?.url || FALLBACK_FEATURED.url,
  }
}

function bottomBarWithFallback(bottomBar: NavBottomBar | null | undefined) {
  if (!bottomBar) return FALLBACK_BOTTOM_BAR
  return {
    ...FALLBACK_BOTTOM_BAR,
    ...bottomBar,
    certifications: bottomBar.certifications?.length
      ? bottomBar.certifications
      : FALLBACK_BOTTOM_BAR.certifications,
  }
}

export function sectionHref(section: NavSection) {
  if (section.Url) return section.Url
  return `/collections/kosher-${slugify(section.title)}`
}

export function augmentHeaderNav(navLinks: HeaderNavLink[]) {
  const source = navLinks.length > 0 ? navLinks : FALLBACK_NAV
  const detectedPrimaryIndex = source.findIndex(isPrimaryShopLink)
  const primaryIndex = Math.max(0, detectedPrimaryIndex)

  const augmented = source.map((link, index) => {
    const sections =
      index === primaryIndex && !isWaysToShopLink(link)
        ? addPrimaryShopSections(link.sections || [])
        : (link.sections || []).map(normalizeSection)

    return {
      ...link,
      title: normalizeLabel(link.title),
      sections,
      featured: featuredWithFallback(link.featured, link),
      bottomBar: bottomBarWithFallback(link.bottomBar),
    }
  })

  if (augmented.some(isWaysToShopLink)) {
    return moveWaysToShopBeforePrimaryShop(augmented)
  }

  const insertAt =
    detectedPrimaryIndex >= 0
      ? primaryIndex
      : Math.min(primaryIndex + 1, augmented.length)
  return moveWaysToShopBeforePrimaryShop([
    ...augmented.slice(0, insertAt),
    WAYS_TO_SHOP_NAV,
    ...augmented.slice(insertAt),
  ])
}

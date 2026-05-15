import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  Drumstick,
  Flame,
  Layers,
  PackageCheck,
  Phone,
  Scissors,
  Search,
  ShieldCheck,
  Snowflake,
  Store,
  Truck,
  Utensils,
} from "lucide-react"

import LearnAnalytics from "@modules/learn/components/learn-analytics"

type ButcherEducationHubProps = {
  countryCode: string
}

type TrackedLinkProps = {
  href: string
  event?: string
  label?: string
  section?: string
  destination?: string
  className: string
  children: ReactNode
}

type Pillar = {
  id: string
  eyebrow: string
  title: string
  body: string
  icon: LucideIcon
  href: string
  event?: string
  points: string[]
}

type CutFamily = {
  title: string
  eyebrow: string
  body: string
  image: string
  imageAlt: string
  icon: LucideIcon
  cuts: string[]
  bestFor: string
  href: string
}

type LinkedGuide = {
  title: string
  body: string
  icon?: LucideIcon
  href: string
  event: string
  cta: string
}

const assets = {
  butcher:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_card_1_40c3310173.jpg",
  order:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_order_fa3561917c.jpg",
  coldPack:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_card_2_75728aa519.jpg",
  beef: "https://helpful-nature-fab70f9c51.media.strapiapp.com/1_01_32_3_primary_5ab9386222.jpg",
  lamb: "https://helpful-nature-fab70f9c51.media.strapiapp.com/3_01_12_1_primary_c58f64bb16.jpg",
  poultry:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_61_02_1_primary_e1cb3ef646.jpg",
  veal: "https://helpful-nature-fab70f9c51.media.strapiapp.com/slow_braised_veal_with_onions_and_carrots_2_01_12_1_d860ac0006.jpg",
}

const pillarData: Pillar[] = [
  {
    id: "kosher-meat-101",
    eyebrow: "Pillar 1",
    title: "Kosher Meat 101",
    body: "Plain-English answers for shoppers who want to understand what kosher meat means before they order.",
    icon: BookOpen,
    href: "#kosher-meat-101",
    event: "view_kashruth_guide",
    points: [
      "What kosher and glatt mean at a customer level",
      "How raw cuts differ from prepared or multi-ingredient items",
      "How Passover status differs from year-round kosher status",
    ],
  },
  {
    id: "kashruth-supervision",
    eyebrow: "Pillar 2",
    title: "Kashruth & Supervision",
    body: "AKC supervision, hechsherim, KFP labeling, and a direct path when a product-level question matters.",
    icon: ShieldCheck,
    href: "#kashruth-supervision",
    event: "view_kashruth_guide",
    points: [
      "AKC supervision since 2002",
      "Mashgiach present every processing shift",
      "Hechsher and Passover links kept together",
    ],
  },
  {
    id: "cut-library",
    eyebrow: "Pillar 3",
    title: "Cut Library",
    body: "A butcher-counter guide to what each cut is, where it shines, and what to buy if you want something similar.",
    icon: Scissors,
    href: "#cut-library",
    event: "view_cut_guide",
    points: [
      "Beef, lamb, veal, poultry, and specialty families",
      "Texture, fat, cooking method, and serving guidance",
      "Direct links into collections and product search",
    ],
  },
  {
    id: "buying-guides",
    eyebrow: "Pillar 4",
    title: "Cooking & Buying Guides",
    body: "Practical order-building guidance for Shabbos, Yom Tov, Passover, grilling, slow cooking, and first-time baskets.",
    icon: CookingPot,
    href: "#buying-guides",
    event: "view_cut_guide",
    points: [
      "How much to buy per person",
      "Which cuts fit each cooking method",
      "Storage, thawing, and dry-ice arrival guidance",
    ],
  },
]

const kosher101: LinkedGuide[] = [
  {
    title: "Start with the product page",
    body: "Each product should tell you whether it is raw or prepared, what its Passover status is, and which kosher details matter before checkout.",
    href: "/store",
    event: "learn_collection_click",
    cta: "Browse products",
  },
  {
    title: "Single-ingredient cuts are simpler",
    body: "Raw beef, lamb, veal, and poultry are easier to understand than sausages, sauces, smoked items, or other multi-ingredient products.",
    href: "/collections/kosher-beef",
    event: "learn_collection_click",
    cta: "Compare raw cuts",
  },
  {
    title: "Meat guidance stays meat-compatible",
    body: "Cooking notes for meat products should never suggest dairy ingredients, dairy cooking steps, or dairy pairings.",
    href: "#buying-guides",
    event: "view_cut_guide",
    cta: "See cooking guides",
  },
  {
    title: "Ask when the label is not enough",
    body: "If you need a specific hechsher, shchita standard, or Passover answer, call before ordering so the team can verify the item.",
    href: "/customer-service",
    event: "learn_contact_click",
    cta: "Ask the counter",
  },
]

const kashruthLinks = [
  {
    title: "Kashruth Supervision",
    body: "AKC supervision, every-shift mashgiach process, and direct verification details.",
    href: "/kashruth/supervision",
    icon: ShieldCheck,
  },
  {
    title: "Hechsherim",
    body: "How meat and poultry are tagged by certifying agency, community standard, and shchita detail.",
    href: "/kashruth/hechsherim",
    icon: BadgeCheck,
  },
  {
    title: "Kosher for Passover",
    body: "KFP labels, prepared-for-Passover items, and how year-round kosher status differs from Passover status.",
    href: "/kashruth/passover",
    icon: ClipboardList,
  },
]

const cutFamilies: CutFamily[] = [
  {
    title: "Beef",
    eyebrow: "Highest hesitation, highest reward",
    body: "Brisket, deckel, flanken, hanger, skirt, oyster steak, London broil, bones, cheek, and ground beef.",
    image: assets.beef,
    imageAlt: "Raw kosher beef cuts in retail packaging.",
    icon: Beef,
    cuts: ["Brisket first cut", "Deckel", "Flanken", "Oyster steak"],
    bestFor: "Braises, roasts, grill cuts, cholent, and holiday mains",
    href: "/collections/kosher-beef",
  },
  {
    title: "Lamb",
    eyebrow: "Premium cuts made less intimidating",
    body: "Rack, chops, shoulder, shanks, ground lamb, riblets, lollipop, and frenched cuts.",
    image: assets.lamb,
    imageAlt: "Raw kosher lamb chops arranged for sale.",
    icon: Flame,
    cuts: ["Rack", "Lollipop chops", "Shoulder", "Shanks"],
    bestFor: "Yom Tov centerpieces, weeknight chops, and slow-cooked meals",
    href: "/collections/kosher-lamb",
  },
  {
    title: "Poultry",
    eyebrow: "The familiar category with useful detail",
    body: "Whole chicken, 8-piece cut-up, cutlets, thighs, wings, drumsticks, turkey, duck, and capon.",
    image: assets.poultry,
    imageAlt: "Raw kosher poultry portions in clear retail packaging.",
    icon: Drumstick,
    cuts: ["Cutlets", "8-piece chicken", "Thighs", "Wings"],
    bestFor: "Shabbos trays, schnitzel, soup, roast chicken, and easy dinners",
    href: "/collections/kosher-chicken",
  },
  {
    title: "Veal",
    eyebrow: "Delicate cuts with clear method guidance",
    body: "Chops, scallopini, schnitzel, riblets, stew meat, and ground veal explained by thickness and cooking style.",
    image: assets.veal,
    imageAlt: "Kosher veal prepared with vegetables in a skillet.",
    icon: Layers,
    cuts: ["Chops", "Scallopini", "Schnitzel", "Riblets"],
    bestFor:
      "Quick sears, gentle braises, small special dinners, and schnitzel",
    href: "/search?q=veal",
  },
  {
    title: "Prepared & Specialty",
    eyebrow: "The South African and Shabbos-table moat",
    body: "Boerewors, biltong, droewors, corned beef, pastrami, pocket pies, kugels, and prepared sides.",
    image: assets.order,
    imageAlt: "A Grillers Pride order being assembled with specialty products.",
    icon: Store,
    cuts: ["Boerewors", "Biltong", "Corned brisket", "Kugels"],
    bestFor:
      "Hard-to-find kosher staples, gifting, travel, and weekly reorders",
    href: "/collections/prepared-and-provisions",
  },
]

const buyingGuides: LinkedGuide[] = [
  {
    title: "How much meat should I buy?",
    body: "Portion guidance for adults, children, mixed menus, leftovers, and big Yom Tov tables.",
    icon: Utensils,
    href: "/customer-service",
    event: "learn_contact_click",
    cta: "Ask for portions",
  },
  {
    title: "Brisket first cut, deckel, or whole?",
    body: "A practical comparison by fat, tenderness, slicing, cook time, and holiday fit.",
    icon: Beef,
    href: "/collections/kosher-brisket",
    event: "learn_collection_click",
    cta: "Compare brisket",
  },
  {
    title: "Best cuts for slow cooking",
    body: "Cholent, braises, roasts, shanks, cheeks, ribs, and the cuts that reward patience.",
    icon: CookingPot,
    href: "/collections/kosher-stew-braising",
    event: "learn_collection_click",
    cta: "Shop slow-cook cuts",
  },
  {
    title: "Best cuts for grilling",
    body: "Steaks, chops, boerewors, skirt, hanger, burgers, and how to avoid overcooking lean kosher cuts.",
    icon: Flame,
    href: "/collections/kosher-steaks",
    event: "learn_collection_click",
    cta: "Shop grill cuts",
  },
  {
    title: "Frozen delivery and thawing",
    body: "What to do when a dry-ice shipment arrives, how to store it, and how to thaw safely.",
    icon: Snowflake,
    href: "/shipping/ups",
    event: "learn_collection_click",
    cta: "Read shipping",
  },
  {
    title: "Build a Shabbos order",
    body: "A balanced basket across protein, prepared sides, soup bones, deli, and easy reorders.",
    icon: PackageCheck,
    href: "/store",
    event: "learn_collection_click",
    cta: "Start an order",
  },
]

const processSteps = [
  {
    title: "Choose with context",
    body: "The guide points customers from a cut question into a collection, search result, or customer-service path.",
    icon: Search,
  },
  {
    title: "Cut and check",
    body: "Products are prepared in the Doraville plant under AKC supervision, with a mashgiach present every processing shift.",
    icon: CheckCircle2,
  },
  {
    title: "Pack for the trip",
    body: "Orders are vacuum-sealed, frozen, and packed with the cold chain in mind before pickup, route delivery, or UPS shipping.",
    icon: Truck,
  },
]

function hrefFor(countryCode: string, href: string) {
  if (href.startsWith("#")) return href
  if (
    href.startsWith("http") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  ) {
    return href
  }
  return `/${countryCode}${href}`
}

function TrackedLink({
  href,
  event,
  label,
  section,
  destination,
  className,
  children,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      data-learn-event={event}
      data-learn-label={label}
      data-learn-section={section}
      data-learn-destination={destination || href}
      className={className}
    >
      {children}
    </Link>
  )
}

function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <p
      className={`font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.18em] ${
        light ? "text-Gold" : "text-VibrantRed"
      }`}
    >
      {children}
    </p>
  )
}

export default function ButcherEducationHub({
  countryCode,
}: ButcherEducationHubProps) {
  return (
    <main className="bg-Scroll text-Charcoal overflow-hidden">
      <LearnAnalytics />

      <section className="border-b border-Charcoal/10 bg-Scroll">
        <div className="content-container py-14 md:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-14">
            <div>
              <Eyebrow>The Grillers Pride Butcher Guide</Eyebrow>
              <h1 className="mt-5 max-w-[780px] font-gyst text-h1-mobile leading-tight text-Charcoal md:text-h1">
                Kosher meat, cut confidence, and cooking guidance from the
                counter outward.
              </h1>
              <p className="mt-6 max-w-[660px] font-maison-neue text-p-lg leading-[1.65] text-Charcoal/75">
                A customer-facing hub for the questions that come up before
                checkout: what a cut is, why it costs what it does, how to cook
                it successfully, and which kashruth details matter for your
                home.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="#cut-library"
                  event="view_cut_guide"
                  label="Explore the cut library"
                  section="hero"
                  className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] bg-Charcoal px-6 py-3 font-rexton text-h6 font-bold uppercase text-Scroll transition-colors hover:bg-Charcoal/90"
                >
                  Explore the cut library
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </TrackedLink>
                <TrackedLink
                  href="#kashruth-supervision"
                  event="view_kashruth_guide"
                  label="Verify supervision"
                  section="hero"
                  className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] border border-Charcoal/25 px-6 py-3 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:border-Charcoal hover:bg-white"
                >
                  Verify supervision
                  <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                </TrackedLink>
              </div>
            </div>

            <div className="grid min-h-[520px] grid-cols-6 grid-rows-[1fr_0.78fr] gap-3 md:gap-4">
              <figure className="relative col-span-6 row-span-1 overflow-hidden rounded-[6px] bg-Charcoal sm:col-span-4 sm:row-span-2">
                <Image
                  src={assets.butcher}
                  alt="Grillers Pride team preparing kosher meat in the Doraville facility."
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-Charcoal/85 via-Charcoal/20 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute left-4 top-4 inline-flex min-h-[36px] items-center gap-2 rounded-[4px] bg-Scroll px-3 py-2 font-maison-neue-mono text-[11px] font-bold uppercase text-Charcoal shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-VibrantRed" />
                  AKC supervised
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.18em] text-Gold">
                    The product principle
                  </p>
                  <p className="mt-2 max-w-[430px] font-gyst text-[28px] leading-tight text-Scroll md:text-[38px]">
                    Teach from the butcher counter outward.
                  </p>
                </figcaption>
              </figure>

              {[
                {
                  src: assets.order,
                  alt: "A Grillers Pride order being checked and assembled.",
                  label: "Product-level answers",
                },
                {
                  src: assets.coldPack,
                  alt: "Frozen kosher meat packed for cold-chain delivery.",
                  label: "Order-to-doorstep handling",
                },
              ].map((image) => (
                <figure
                  key={image.src}
                  className="relative col-span-3 overflow-hidden rounded-[6px] bg-Charcoal sm:col-span-2"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 18vw, 50vw"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-Charcoal/80 via-Charcoal/10 to-transparent"
                    aria-hidden="true"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 px-4 pb-4 font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Scroll">
                    {image.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="content-container py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-4">
            {pillarData.map((pillar) => {
              const Icon = pillar.icon
              return (
                <TrackedLink
                  key={pillar.id}
                  href={pillar.href}
                  event={pillar.event}
                  label={pillar.title}
                  section="pillar_nav"
                  className="group block rounded-[6px] border border-Charcoal/10 bg-Scroll p-5 transition-colors hover:border-Gold hover:bg-white"
                >
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <span className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-RichGold">
                      {pillar.eyebrow}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-Charcoal/15 bg-white text-VibrantRed transition-transform group-hover:translate-x-1">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                  </div>
                  <h2 className="font-gyst text-[28px] leading-tight text-Charcoal">
                    {pillar.title}
                  </h2>
                  <p className="mt-3 font-maison-neue text-p-sm leading-[1.6] text-Charcoal/70">
                    {pillar.body}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {pillar.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2 font-maison-neue text-p-sm leading-snug text-Charcoal/80"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-RichGold" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </TrackedLink>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="kosher-meat-101"
        className="border-y border-Charcoal/10 bg-Scroll"
      >
        <div className="content-container py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            <div>
              <Eyebrow>Kosher Meat 101</Eyebrow>
              <h2 className="mt-4 max-w-[620px] font-gyst text-h2-mobile leading-tight text-Charcoal md:text-h2">
                Useful answers before the order, not abstract food history.
              </h2>
              <p className="mt-5 max-w-[560px] font-maison-neue text-p-md leading-[1.7] text-Charcoal/75 md:text-p-lg">
                The hub is written for observant shoppers, kosher-curious
                customers, and cut-curious home cooks at the same time. It
                explains the basics without replacing product labels,
                certification pages, or direct kashruth review.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {kosher101.map((item) => (
                <TrackedLink
                  key={item.title}
                  href={hrefFor(countryCode, item.href)}
                  event={item.event}
                  label={item.title}
                  section="kosher_meat_101"
                  className="group block rounded-[6px] border border-Charcoal/10 bg-white p-5 transition-colors hover:border-Gold hover:bg-Scroll/40"
                >
                  <h3 className="font-rexton text-[22px] leading-tight text-Charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-maison-neue text-p-sm leading-[1.65] text-Charcoal/70">
                    {item.body}
                  </p>
                  <span className="mt-5 inline-flex min-h-[36px] items-center gap-2 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors group-hover:text-VibrantRed">
                    {item.cta}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </span>
                </TrackedLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="kashruth-supervision" className="bg-Charcoal text-Scroll">
        <div className="content-container py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-14">
            <div>
              <Eyebrow light>Kashruth & Supervision</Eyebrow>
              <h2 className="mt-4 max-w-[700px] font-gyst text-h2-mobile leading-tight md:text-h2">
                The trust pages should work like one system.
              </h2>
              <p className="mt-5 max-w-[620px] font-maison-neue text-p-md leading-[1.7] text-Scroll/78 md:text-p-lg">
                Grillers Pride operates under Atlanta Kashruth Commission
                supervision, with a mashgiach present every processing shift.
                The hub keeps supervision, hechsherim, and Passover status close
                together so customers can verify before they buy.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border-l border-Gold/50 pl-4">
                <p className="font-gyst text-[34px] leading-none text-Gold">
                  2002
                </p>
                <p className="mt-2 font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Scroll/65">
                  AKC supervision
                </p>
              </div>
              <div className="border-l border-Gold/50 pl-4">
                <p className="font-gyst text-[34px] leading-none text-Gold">
                  Every shift
                </p>
                <p className="mt-2 font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Scroll/65">
                  Mashgiach present
                </p>
              </div>
              <div className="border-l border-Gold/50 pl-4">
                <p className="font-gyst text-[34px] leading-none text-Gold">
                  Item level
                </p>
                <p className="mt-2 font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Scroll/65">
                  Status and hechsher
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {kashruthLinks.map((item) => {
              const Icon = item.icon
              const href = hrefFor(countryCode, item.href)
              return (
                <TrackedLink
                  key={item.href}
                  href={href}
                  event="view_kashruth_guide"
                  label={item.title}
                  section="kashruth"
                  className="group block rounded-[6px] border border-Scroll/15 bg-Scroll/[0.04] p-5 transition-colors hover:border-Gold/70 hover:bg-Scroll/[0.08]"
                >
                  <div className="mb-7 flex items-center justify-between gap-4">
                    <Icon className="h-6 w-6 text-Gold" strokeWidth={1.8} />
                    <ArrowRight className="h-4 w-4 text-Gold transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="font-rexton text-[24px] leading-tight text-Scroll">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-maison-neue text-p-sm leading-[1.65] text-Scroll/70">
                    {item.body}
                  </p>
                </TrackedLink>
              )
            })}
          </div>

          <div className="mt-8 grid gap-4 border-t border-Scroll/15 pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <p className="max-w-3xl font-maison-neue text-p-md leading-[1.7] text-Scroll/75">
              For a specific kashruth question, call the office or verify
              directly with the Atlanta Kashruth Commission. The goal is a clear
              answer, not a guess hidden inside marketing copy.
            </p>
            <TrackedLink
              href={hrefFor(countryCode, "/customer-service")}
              event="learn_contact_click"
              label="Ask a kashruth question"
              section="kashruth"
              className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] bg-Gold px-6 py-3 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:bg-Gold/90"
            >
              Ask before ordering
              <Phone className="h-4 w-4" strokeWidth={2} />
            </TrackedLink>
          </div>
        </div>
      </section>

      <section id="cut-library" className="bg-white">
        <div className="content-container py-14 md:py-20">
          <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div>
              <Eyebrow>Cut Library</Eyebrow>
              <h2 className="mt-4 max-w-[720px] font-gyst text-h2-mobile leading-tight text-Charcoal md:text-h2">
                Make unfamiliar cuts feel orderable.
              </h2>
            </div>
            <p className="max-w-[680px] font-maison-neue text-p-md leading-[1.7] text-Charcoal/75 md:text-p-lg">
              Each family starts with the same butcher-counter questions: what
              is it, where does it come from, how fatty or lean is it, what
              usually goes wrong, and what should I buy instead if this is not
              the right fit?
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {cutFamilies.map((family) => {
              const Icon = family.icon
              const href = hrefFor(countryCode, family.href)
              return (
                <TrackedLink
                  key={family.title}
                  href={href}
                  event="learn_collection_click"
                  label={family.title}
                  section="cut_library"
                  className="group flex min-h-full flex-col overflow-hidden rounded-[6px] border border-Charcoal/10 bg-Scroll transition-colors hover:border-Gold hover:bg-white"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-Charcoal">
                    <Image
                      src={family.image}
                      alt={family.imageAlt}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-Charcoal/75 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                    <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-[4px] bg-Scroll text-VibrantRed">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-RichGold">
                      {family.eyebrow}
                    </p>
                    <h3 className="mt-3 font-gyst text-[30px] leading-tight text-Charcoal">
                      {family.title}
                    </h3>
                    <p className="mt-3 font-maison-neue text-p-sm leading-[1.6] text-Charcoal/72">
                      {family.body}
                    </p>

                    <div className="mt-5 border-t border-Charcoal/10 pt-4">
                      <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.14em] text-Charcoal/55">
                        First guides
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {family.cuts.map((cut) => (
                          <span
                            key={cut}
                            className="rounded-[4px] border border-Charcoal/15 bg-white px-2.5 py-1 font-maison-neue text-p-sm text-Charcoal/75"
                          >
                            {cut}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="mt-4 font-maison-neue text-p-sm leading-[1.55] text-Charcoal/70">
                      <span className="font-bold text-Charcoal">Best for:</span>{" "}
                      {family.bestFor}
                    </p>

                    <span className="mt-auto inline-flex min-h-[48px] items-center gap-2 pt-5 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors group-hover:text-VibrantRed">
                      Shop and compare
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        strokeWidth={2}
                      />
                    </span>
                  </div>
                </TrackedLink>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="buying-guides"
        className="border-y border-Charcoal/10 bg-Scroll"
      >
        <div className="content-container py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            <div>
              <Eyebrow>Cooking & Buying Guides</Eyebrow>
              <h2 className="mt-4 max-w-[620px] font-gyst text-h2-mobile leading-tight text-Charcoal md:text-h2">
                Build a better order in fewer calls.
              </h2>
              <p className="mt-5 max-w-[560px] font-maison-neue text-p-md leading-[1.7] text-Charcoal/75 md:text-p-lg">
                The first guide set focuses on the questions that block cart
                building: portion size, cooking method, Passover hosting,
                Shabbos planning, storage, and what to try when the customer
                only knows chicken breasts and ground beef.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={hrefFor(countryCode, "/collections/kosher-beef")}
                  event="learn_collection_click"
                  label="Start with beef"
                  section="buying_guides"
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-[5px] bg-Charcoal px-6 py-3 font-rexton text-h6 font-bold uppercase text-Scroll transition-colors hover:bg-Charcoal/90"
                >
                  Start with beef
                  <Beef className="h-4 w-4" strokeWidth={2} />
                </TrackedLink>
                <TrackedLink
                  href={hrefFor(countryCode, "/customer-service")}
                  event="learn_contact_click"
                  label="Call for help building an order"
                  section="buying_guides"
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-[5px] border border-Charcoal/25 px-6 py-3 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:border-Charcoal hover:bg-white"
                >
                  Call for help
                  <Phone className="h-4 w-4" strokeWidth={2} />
                </TrackedLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {buyingGuides.map((guide) => {
                const Icon = guide.icon
                return (
                  <TrackedLink
                    key={guide.title}
                    href={hrefFor(countryCode, guide.href)}
                    event={guide.event}
                    label={guide.title}
                    section="buying_guides"
                    className="group block rounded-[6px] border border-Charcoal/10 bg-white p-5 transition-colors hover:border-Gold hover:bg-Scroll/40"
                  >
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[4px] border border-Charcoal/15 bg-Scroll text-VibrantRed">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-rexton text-[22px] leading-tight text-Charcoal">
                      {guide.title}
                    </h3>
                    <p className="mt-3 font-maison-neue text-p-sm leading-[1.65] text-Charcoal/70">
                      {guide.body}
                    </p>
                    <span className="mt-5 inline-flex min-h-[36px] items-center gap-2 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors group-hover:text-VibrantRed">
                      {guide.cta}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        strokeWidth={2}
                      />
                    </span>
                  </TrackedLink>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="content-container py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:items-center lg:gap-14">
            <div className="relative min-h-[420px] overflow-hidden rounded-[6px] bg-Charcoal">
              <Image
                src={assets.coldPack}
                alt="Cold-chain packing for a frozen kosher meat shipment."
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-Charcoal/90 via-Charcoal/20 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <Eyebrow light>Order to doorstep</Eyebrow>
                <h2 className="mt-3 max-w-[540px] font-gyst text-h2-mobile leading-tight text-Scroll md:text-h2">
                  Education should follow the meat all the way home.
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {processSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <article
                    key={step.title}
                    className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 border-t border-Charcoal/15 py-5 first:border-t-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-Charcoal/15 bg-Scroll text-VibrantRed">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-RichGold">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-2 font-rexton text-[24px] leading-tight text-Charcoal">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-[620px] font-maison-neue text-p-sm leading-[1.65] text-Charcoal/70">
                        {step.body}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-Charcoal text-Scroll">
        <div className="content-container py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <Eyebrow light>Need a human answer?</Eyebrow>
              <h2 className="mt-4 max-w-[760px] font-gyst text-h2-mobile leading-tight md:text-h2">
                If the guide does not answer it cleanly, ask the counter.
              </h2>
              <p className="mt-5 max-w-[700px] font-maison-neue text-p-md leading-[1.7] text-Scroll/75 md:text-p-lg">
                Call for cut selection, hechsher questions, Passover status,
                substitutions, or help building a first order. The hub should
                reduce hesitation, not replace judgment when a specific family
                standard matters.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <TrackedLink
                href={hrefFor(countryCode, "/customer-service")}
                event="learn_contact_click"
                label="Contact customer service"
                section="footer_cta"
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] bg-Gold px-6 py-3 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:bg-Gold/90"
              >
                Contact us
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </TrackedLink>
              <TrackedLink
                href={hrefFor(countryCode, "/store")}
                event="learn_collection_click"
                label="Shop the full counter"
                section="footer_cta"
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] border border-Scroll/20 px-6 py-3 font-rexton text-h6 font-bold uppercase text-Scroll transition-colors hover:border-Gold hover:text-Gold"
              >
                Shop the counter
                <Store className="h-4 w-4" strokeWidth={2} />
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

import Image from "next/image"
import {
  ArrowRight,
  ChefHat,
  Clock3,
  Flame,
  Search,
  Sparkles,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const recipePaths = [
  {
    title: "Shabbos table",
    href: "/recipes?bucket=shabbos-table#recipes-results",
    icon: Sparkles,
  },
  {
    title: "Weeknight dinner",
    href: "/recipes?bucket=weeknight-dinner#recipes-results",
    icon: Clock3,
  },
  {
    title: "Steaks & chops",
    href: "/recipes?bucket=steaks-chops#recipes-results",
    icon: Flame,
  },
  {
    title: "Whole birds",
    href: "/recipes?bucket=whole-birds#recipes-results",
    icon: ChefHat,
  },
]

const learningLinks = [
  {
    title: "Cut library",
    description: "Choose the right roast, chop, steak, or poultry cut.",
    href: "/learn/cuts",
  },
  {
    title: "Cold-chain planning",
    description: "Understand delivery, packing, and freezer timing.",
    href: "/learn/cold-chain",
  },
]

export default function LearnEntrySection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-stretch">
          <LocalizedClientLink
            href="/recipes"
            className="group relative grid min-h-[420px] overflow-hidden bg-Charcoal text-white"
          >
            <Image
              src="/images/pages/home/Plate_Steak_Cut_Potatoes.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-Charcoal/55" />
            <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
              <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-Gold">
                Recipe discovery
              </p>
              <h2 className="mt-3 max-w-2xl font-gyst text-h2-mobile leading-none md:text-h2">
                Find the right meal for the cut in your cart
              </h2>
              <p className="mt-4 max-w-xl font-maison-neue text-p-lg leading-relaxed text-white/78">
                Search the recipe hub by Shabbos table, weeknight dinner, whole
                birds, steaks, chops, and holiday cooking.
              </p>
              <span className="mt-7 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-[5px] bg-Gold px-5 font-rexton text-xs font-bold uppercase tracking-wide text-Charcoal">
                Open recipe hub
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </LocalizedClientLink>

          <div className="flex min-w-0 flex-col justify-between border-y border-Charcoal/15 py-6 lg:border-y-0 lg:py-0">
            <div>
              <div className="mb-5 flex items-start justify-between gap-5">
                <div>
                  <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
                    Browse recipes
                  </p>
                  <h3 className="mt-2 font-gyst text-h3-mobile leading-tight text-Charcoal md:text-h3">
                    Start with the meal, then pick the cut
                  </h3>
                </div>
                <LocalizedClientLink
                  href="/recipes"
                  aria-label="Search all recipes"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-Charcoal text-Charcoal hover:bg-Charcoal hover:text-white"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                </LocalizedClientLink>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {recipePaths.map((path) => {
                  const Icon = path.icon
                  return (
                    <LocalizedClientLink
                      key={path.href}
                      href={path.href}
                      className="group flex min-h-[112px] flex-col justify-between rounded-[5px] border border-Charcoal/10 bg-Scroll p-4 transition-colors hover:border-Gold hover:bg-Gold/10"
                    >
                      <Icon
                        className="h-5 w-5 text-Charcoal/60 group-hover:text-Gold"
                        aria-hidden="true"
                      />
                      <span className="font-maison-neue text-sm font-semibold leading-tight text-Charcoal">
                        {path.title}
                      </span>
                    </LocalizedClientLink>
                  )
                })}
              </div>
            </div>

            <div className="mt-7 border-t border-Charcoal/15 pt-5">
              <p className="mb-3 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal/55">
                Butcher context
              </p>
              <div className="grid gap-3">
                {learningLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className="group flex min-h-[76px] items-center justify-between gap-4 rounded-[5px] border border-Charcoal/10 px-4 py-3 hover:border-Gold"
                  >
                    <span>
                      <span className="block font-maison-neue text-sm font-semibold text-Charcoal">
                        {link.title}
                      </span>
                      <span className="mt-1 block font-maison-neue text-xs leading-relaxed text-Charcoal/60">
                        {link.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-Charcoal/50 group-hover:text-Gold"
                      aria-hidden="true"
                    />
                  </LocalizedClientLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

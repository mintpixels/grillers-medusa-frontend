import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const entries = [
  {
    title: "Cut library",
    eyebrow: "Butcher guide",
    description:
      "Compare roasts, steaks, chops, poultry, and specialty cuts before you build the cart.",
    href: "/learn/cuts",
    image: "/images/learn/cut-library-hero.jpg",
  },
  {
    title: "Planning a cold-chain order",
    eyebrow: "Delivery guide",
    description:
      "See how pack-out, delivery routes, UPS transit, and freezer planning fit together.",
    href: "/learn/cold-chain",
    image: "/images/learn/cold-chain.jpg",
  },
]

export default function LearnEntrySection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4.5">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
              Learn
            </p>
            <h2 className="mt-2 font-gyst text-h2-mobile leading-tight text-Charcoal md:text-h2">
              Shop with a butcher’s context
            </h2>
          </div>
          <LocalizedClientLink
            href="/learn"
            className="inline-flex min-h-[44px] items-center gap-2 self-start font-rexton text-p-sm-mono font-bold uppercase tracking-wide text-Charcoal md:self-auto"
          >
            See all
            <Image
              src="/images/icons/arrow-right.svg"
              width={20}
              height={12}
              alt=""
              aria-hidden="true"
            />
          </LocalizedClientLink>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {entries.map((entry) => (
            <LocalizedClientLink
              key={entry.href}
              href={entry.href}
              className="group grid min-w-0 grid-cols-[120px_minmax(0,1fr)] gap-4 border-t border-Charcoal/20 py-5 transition-colors hover:bg-Scroll/60 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={entry.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 180px, 120px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 self-center">
                <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-RichGold">
                  {entry.eyebrow}
                </p>
                <h3 className="mt-2 font-gyst text-h4 font-bold leading-tight text-Charcoal">
                  {entry.title}
                </h3>
                <p className="mt-2 font-maison-neue text-sm leading-relaxed text-Charcoal/65">
                  {entry.description}
                </p>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}


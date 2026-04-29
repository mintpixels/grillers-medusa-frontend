import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Page Not Found | Grillers Pride",
  description:
    "The page you're looking for doesn't exist. Browse the counter, find a recipe, or get in touch.",
  robots: { index: false, follow: false },
}

const SUGGESTED_LINKS = [
  { label: "Shop all products", href: "/store", variant: "primary" as const },
  { label: "Browse bestsellers", href: "/#bestsellers", variant: "secondary" as const },
  { label: "Recipes", href: "/recipes", variant: "secondary" as const },
  { label: "Customer service", href: "/customer-service", variant: "secondary" as const },
]

const POPULAR_COLLECTIONS = [
  { label: "Beef", href: "/collections/kosher-beef" },
  { label: "Chicken", href: "/collections/kosher-chicken" },
  { label: "Lamb & Veal", href: "/collections/kosher-lamb" },
  { label: "Prepared & Provisions", href: "/collections/prepared-and-provisions" },
]

export default function NotFound() {
  return (
    <div className="bg-Scroll/40 border-b border-Charcoal/10">
      <div className="content-container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-wider text-Gold mb-4">
            Error 404
          </p>
          <h1 className="text-h1-mobile md:text-h1 font-gyst text-Charcoal mb-5">
            We couldn&apos;t find that page
          </h1>
          <p className="text-p-md text-Charcoal/80 mb-8 leading-relaxed">
            The link you followed may be broken, or the page may have moved.
            Try one of the spots below — or give us a call and we&apos;ll point
            you in the right direction.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {SUGGESTED_LINKS.map((link) => (
              <LocalizedClientLink
                key={link.href}
                href={link.href}
                className={
                  link.variant === "primary"
                    ? "inline-flex items-center h-11 px-6 bg-Gold text-Charcoal font-maison-neue font-bold text-p-md rounded-[5px] uppercase tracking-wide hover:bg-Gold/90 transition-colors"
                    : "inline-flex items-center h-11 px-6 border border-Charcoal/30 text-Charcoal font-maison-neue font-bold text-p-md rounded-[5px] uppercase tracking-wide hover:border-Gold hover:text-Gold transition-colors"
                }
              >
                {link.label}
              </LocalizedClientLink>
            ))}
          </div>

          <div className="pt-8 border-t border-Charcoal/10">
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-wider text-Charcoal/50 mb-4">
              Popular categories
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_COLLECTIONS.map((c) => (
                <LocalizedClientLink
                  key={c.href}
                  href={c.href}
                  className="px-4 py-2 border border-Charcoal/20 rounded-full text-p-sm font-maison-neue text-Charcoal hover:border-Gold hover:text-Gold transition-colors"
                >
                  {c.label}
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          <div className="mt-10 text-p-sm text-Charcoal/60">
            Still stuck?{" "}
            <a
              href="tel:7704548108"
              className="text-Gold hover:text-Gold/80 font-semibold"
            >
              (770) 454-8108
            </a>
            {" · "}
            <a
              href="mailto:peter@grillerspride.com"
              className="text-Gold hover:text-Gold/80 font-semibold"
            >
              peter@grillerspride.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

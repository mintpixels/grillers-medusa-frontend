import {
  standardsComparisonRows,
  type StandardsRow,
} from "@lib/content/standards-comparison"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type StandardsComparisonProps = {
  rows?: StandardsRow[]
  title?: string
  eyebrow?: string
  comparisonLabel?: string
  compact?: boolean
}

export default function StandardsComparison({
  rows = standardsComparisonRows,
  title = "For kosher households, the order has to be right.",
  eyebrow = "Why families choose us",
  compact = false,
}: StandardsComparisonProps) {
  return (
    <section
      aria-labelledby="standards-comparison-heading"
      className={compact ? "bg-white py-10" : "bg-Scroll py-12 md:py-16"}
    >
      <div className="content-container">
        <div className="mb-7 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
          <div>
            <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
              {eyebrow}
            </p>
            <h2
              id="standards-comparison-heading"
              className="mt-3 font-gyst text-h2-mobile font-bold leading-tight text-Charcoal md:text-h2"
            >
              {title}
            </h2>
          </div>
          <div>
            <p className="font-maison-neue-mono text-p-sm-mono font-bold uppercase tracking-wide text-VibrantRed">
              The butcher difference
            </p>
            <p className="mt-3 font-maison-neue text-p-md leading-relaxed text-Charcoal/70">
              Online kosher shopping is not just about finding meat. It is about
              knowing the standards, filling the freezer, feeding the table, and
              trusting the box that arrives at your door.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row, index) => (
            <article
              key={row.title}
              className="rounded-[5px] border border-Charcoal/12 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-Gold/60 bg-Gold/15 font-maison-neue-mono text-xs font-bold text-Charcoal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-maison-neue text-p-lg font-bold leading-snug text-Charcoal">
                  {row.title}
                </h3>
              </div>
              <p className="font-maison-neue text-sm leading-relaxed text-Charcoal/72">
                {row.body}
              </p>
              <p className="mt-5 border-t border-Charcoal/10 pt-4 font-maison-neue text-sm leading-relaxed text-Charcoal/60">
                <span className="mb-1 block font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-VibrantRed">
                  Why it matters
                </span>
                {row.proof}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <LocalizedClientLink
            href="/collections"
            className="inline-flex min-h-[44px] items-center rounded-[5px] bg-Charcoal px-5 py-3 font-maison-neue-mono text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-Charcoal/90"
          >
            Shop collections
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/kashruth/hechsherim"
            className="inline-flex min-h-[44px] items-center rounded-[5px] border border-Charcoal/25 px-5 py-3 font-maison-neue-mono text-xs font-bold uppercase tracking-wide text-Charcoal transition-colors hover:border-Gold hover:text-Charcoal"
          >
            Check kashruth details
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

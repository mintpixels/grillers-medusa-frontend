import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"

import LearnAnalytics from "@modules/learn/components/learn-analytics"
import type { LearnArticle } from "@modules/learn/data/butcher-guides"

type LearnArticleTemplateProps = {
  article: LearnArticle
  countryCode: string
}

type TrackedLinkProps = {
  href: string
  event?: string
  label: string
  section: string
  className: string
  children: ReactNode
}

function hrefFor(countryCode: string, href: string) {
  if (
    href.startsWith("#") ||
    href.startsWith("http") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  ) {
    return href
  }

  if (href.startsWith(`/${countryCode}/`)) return href
  return `/${countryCode}${href.startsWith("/") ? href : `/${href}`}`
}

function TrackedLink({
  href,
  event = "view_cut_guide",
  label,
  section,
  className,
  children,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      data-learn-event={event}
      data-learn-label={label}
      data-learn-section={section}
      data-learn-destination={href}
      className={className}
    >
      {children}
    </Link>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.18em] text-VibrantRed">
      {children}
    </p>
  )
}

export default function LearnArticleTemplate({
  article,
  countryCode,
}: LearnArticleTemplateProps) {
  return (
    <main className="overflow-hidden bg-Scroll text-Charcoal">
      <LearnAnalytics />

      <section className="border-b border-Charcoal/10 bg-Scroll">
        <div className="content-container py-10 md:py-16 lg:py-20">
          <div className="mb-8 flex flex-wrap items-center gap-3 font-maison-neue text-p-sm text-Charcoal/65">
            <Link
              href={`/${countryCode}/learn`}
              className="hover:text-RichGold"
            >
              Butcher Guide
            </Link>
            <span>/</span>
            <span>{article.category}</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14">
            <div>
              <Eyebrow>{article.category}</Eyebrow>
              <h1 className="mt-4 max-w-[820px] font-gyst text-h1-mobile leading-tight text-Charcoal md:text-h1">
                {article.title}
              </h1>
              <p className="mt-6 max-w-[680px] font-maison-neue text-p-lg leading-[1.65] text-Charcoal/75">
                {article.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.14em] text-Charcoal/60">
                {article.updated && <span>Updated {article.updated}</span>}
                {article.readTime && <span>{article.readTime}</span>}
              </div>

              {(article.primaryCta || article.secondaryCta) && (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {article.primaryCta && (
                    <TrackedLink
                      href={hrefFor(countryCode, article.primaryCta.href)}
                      event={article.primaryCta.event}
                      label={article.primaryCta.label}
                      section="article_hero"
                      className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] bg-Charcoal px-6 py-3 font-rexton text-h6 font-bold uppercase text-Scroll transition-colors hover:bg-Charcoal/90"
                    >
                      {article.primaryCta.label}
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </TrackedLink>
                  )}
                  {article.secondaryCta && (
                    <TrackedLink
                      href={hrefFor(countryCode, article.secondaryCta.href)}
                      event={article.secondaryCta.event}
                      label={article.secondaryCta.label}
                      section="article_hero"
                      className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] border border-Charcoal/25 px-6 py-3 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:border-Charcoal hover:bg-white"
                    >
                      {article.secondaryCta.label}
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </TrackedLink>
                  )}
                </div>
              )}
            </div>

            <figure className="relative min-h-[420px] overflow-hidden rounded-[6px] bg-Charcoal md:min-h-[560px]">
              <Image
                src={article.heroImage}
                alt={article.heroAlt}
                fill
                priority
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-Charcoal/85 via-Charcoal/15 to-transparent"
                aria-hidden="true"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                <p className="max-w-[520px] font-gyst text-[30px] leading-tight text-Scroll md:text-[42px]">
                  {article.quickAnswer}
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="content-container py-10 md:py-14">
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[6px] border border-Charcoal/10 bg-Scroll p-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-VibrantRed" />
                  <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Charcoal/60">
                    In this guide
                  </p>
                </div>
                <nav className="mt-5 space-y-3">
                  {article.sections.map((section) => (
                    <Link
                      key={section.id}
                      href={`#${section.id}`}
                      className="block font-maison-neue text-p-sm leading-snug text-Charcoal/72 transition-colors hover:text-RichGold"
                    >
                      {section.heading}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>

            <article className="min-w-0">
              <div className="grid gap-3 sm:grid-cols-3">
                {article.facts.map((fact) => (
                  <div
                    key={`${fact.label}-${fact.value}`}
                    className="rounded-[6px] border border-Charcoal/10 bg-Scroll p-5"
                  >
                    <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.14em] text-RichGold">
                      {fact.label}
                    </p>
                    <p className="mt-2 font-rexton text-[22px] leading-tight text-Charcoal">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-12">
                {article.sections.map((section) => (
                  <section
                    id={section.id}
                    key={section.id}
                    className="scroll-mt-28 border-t border-Charcoal/10 pt-10 first:border-t-0 first:pt-0"
                  >
                    <h2 className="font-gyst text-h2-mobile leading-tight text-Charcoal md:text-h2">
                      {section.heading}
                    </h2>

                    {section.body?.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="mt-5 max-w-[820px] font-maison-neue text-p-md leading-[1.72] text-Charcoal/78 md:text-p-lg"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-3 rounded-[6px] border border-Charcoal/10 bg-Scroll p-4 font-maison-neue text-p-sm leading-[1.55] text-Charcoal/78"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-RichGold" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.table && (
                      <div className="mt-7 overflow-hidden rounded-[6px] border border-Charcoal/10">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[680px] border-collapse bg-white font-maison-neue text-p-sm">
                            <thead className="bg-Charcoal text-Scroll">
                              <tr>
                                {section.table.columns.map((column) => (
                                  <th
                                    key={column}
                                    className="px-4 py-3 text-left font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.14em]"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.table.rows.map((row, index) => (
                                <tr
                                  key={`${section.id}-${index}`}
                                  className="border-t border-Charcoal/10"
                                >
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={`${section.id}-${index}-${cellIndex}`}
                                      className="px-4 py-4 align-top leading-[1.55] text-Charcoal/75 first:font-bold first:text-Charcoal"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {section.callout && (
                      <div className="mt-7 rounded-[6px] border border-Gold/40 bg-Gold/10 p-5">
                        <div className="flex gap-3">
                          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-RichGold" />
                          <p className="font-maison-neue text-p-md leading-[1.65] text-Charcoal/80">
                            {section.callout}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {article.faqs.length > 0 && (
        <section className="border-y border-Charcoal/10 bg-Scroll">
          <div className="content-container py-12 md:py-16">
            <Eyebrow>Common Questions</Eyebrow>
            <h2 className="mt-4 max-w-[720px] font-gyst text-h2-mobile leading-tight text-Charcoal md:text-h2">
              Quick answers for this guide.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {article.faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-[6px] border border-Charcoal/10 bg-white p-5"
                >
                  <h3 className="font-rexton text-[22px] leading-tight text-Charcoal">
                    {faq.question}
                  </h3>
                  <p className="mt-3 font-maison-neue text-p-sm leading-[1.65] text-Charcoal/72">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-Charcoal text-Scroll">
        <div className="content-container py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
            <div>
              <Eyebrow>Next Steps</Eyebrow>
              <h2 className="mt-4 max-w-[760px] font-gyst text-h2-mobile leading-tight md:text-h2">
                Keep learning or choose the next step.
              </h2>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {article.primaryCta && (
                  <TrackedLink
                    href={hrefFor(countryCode, article.primaryCta.href)}
                    event={article.primaryCta.event}
                    label={article.primaryCta.label}
                    section="article_footer"
                    className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] bg-Gold px-6 py-3 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:bg-Gold/90"
                  >
                    {article.primaryCta.label}
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </TrackedLink>
                )}
                <TrackedLink
                  href={`/${countryCode}/learn`}
                  event="view_learn_hub"
                  label="Back to the Butcher Guide"
                  section="article_footer"
                  className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[5px] border border-Scroll/20 px-6 py-3 font-rexton text-h6 font-bold uppercase text-Scroll transition-colors hover:border-Gold hover:text-Gold"
                >
                  Back to the guide
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </TrackedLink>
              </div>
            </div>

            <div>
              <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Gold">
                Related guides
              </p>
              <div className="mt-4 space-y-3">
                {article.related.map((link) => (
                  <TrackedLink
                    key={`${link.href}-${link.label}`}
                    href={hrefFor(countryCode, link.href)}
                    event={link.event || "view_cut_guide"}
                    label={link.label}
                    section="related_guides"
                    className="group flex items-center justify-between gap-4 border-t border-Scroll/15 py-3 font-maison-neue text-p-sm text-Scroll/78 transition-colors first:border-t-0 hover:text-Gold"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </TrackedLink>
                ))}
              </div>

              {article.sources && article.sources.length > 0 && (
                <div className="mt-8">
                  <p className="font-maison-neue-mono text-[11px] font-bold uppercase tracking-[0.16em] text-Gold">
                    Sources
                  </p>
                  <div className="mt-4 space-y-3">
                    {article.sources.map((link) => (
                      <a
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between gap-4 border-t border-Scroll/15 py-3 font-maison-neue text-p-sm text-Scroll/78 transition-colors first:border-t-0 hover:text-Gold"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

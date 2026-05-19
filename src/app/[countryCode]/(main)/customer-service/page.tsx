import { Metadata } from "next"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCustomerServiceData } from "@lib/data/strapi/customer-service"

export async function generateMetadata(): Promise<Metadata> {
  const data = await getCustomerServiceData()
  return {
    title: `${data.Title} | Grillers Pride`,
    description: data.Intro,
  }
}

export default async function CustomerServicePage() {
  const data = await getCustomerServiceData()
  const phoneDigits = data.ContactPhone.replace(/\D/g, "")
  const navItems = [
    { id: "get-in-touch", label: "Get in touch" },
    { id: "faq", label: "Frequently asked questions" },
    { id: "policies", label: "Policies" },
  ]

  return (
    <div className="bg-White">
      <section className="border-b border-Scroll/15 bg-Charcoal text-Scroll">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <p className="mb-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.18em] text-Gold">
            Support
          </p>
          <h1 className="max-w-3xl font-gyst text-h1-mobile leading-tight text-Scroll text-balance md:text-h1">
            {data.Title}
          </h1>
          <p className="mt-5 max-w-2xl font-maison-neue text-p-md leading-[1.65] text-Scroll/85 md:text-p-lg text-pretty">
            {data.Intro}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-16 pt-8 md:pb-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28 border-t border-Charcoal/20 pt-5">
            <p className="mb-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
              On this page
            </p>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="border-b border-Charcoal/10 py-2 font-maison-neue text-p-sm leading-snug text-Charcoal/70 transition-colors hover:text-Charcoal"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
        <section
          aria-labelledby="cs-contact"
          id="get-in-touch"
          className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
        >
          <h2
            id="cs-contact"
            className="mb-5 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3"
          >
            Get in touch
          </h2>
          <dl className="grid border-t border-Charcoal/20 sm:grid-cols-3">
            <div className="border-b border-Charcoal/20 py-5 sm:border-r sm:px-5">
              <dt className="mb-2 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                Phone
              </dt>
              <dd>
                <a
                  href={`tel:${phoneDigits}`}
                  className="font-maison-neue text-p-md font-semibold text-Charcoal transition-colors hover:text-RichGold"
                >
                  {data.ContactPhone}
                </a>
              </dd>
            </div>
            <div className="border-b border-Charcoal/20 py-5 sm:border-r sm:px-5">
              <dt className="mb-2 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                Email
              </dt>
              <dd>
                <a
                  href={`mailto:${data.ContactEmail}`}
                  className="break-all font-maison-neue text-p-md font-semibold text-Charcoal transition-colors hover:text-RichGold"
                >
                  {data.ContactEmail}
                </a>
              </dd>
            </div>
            <div className="border-b border-Charcoal/20 py-5 sm:px-5">
              <dt className="mb-2 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                Hours
              </dt>
              <dd className="font-maison-neue text-p-sm leading-[1.6] text-Charcoal/80">
                {data.ContactHours}
              </dd>
            </div>
          </dl>
        </section>

        {Array.isArray(data.Content) && data.Content.length > 0 && (
          <section className="border-t border-Charcoal/20 py-8 font-maison-neue text-Charcoal/90 md:py-10 [&_a]:text-RichGold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_p]:my-5 [&_p]:leading-[1.68]">
            <BlocksRenderer content={data.Content} />
          </section>
        )}

        <section
          aria-labelledby="cs-faq"
          id="faq"
          className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
        >
          <h2
            id="cs-faq"
            className="mb-5 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3"
          >
            Frequently asked questions
          </h2>
          <div className="border-t border-Charcoal/20">
            {data.FAQs.map((faq, idx) => (
              <details key={idx} className="group border-b border-Charcoal/20 py-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                  <span className="font-maison-neue text-p-md font-semibold text-Charcoal">
                    {faq.Question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl leading-none text-RichGold transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl font-maison-neue text-p-sm leading-relaxed text-Charcoal/80">
                  {faq.Answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="cs-policies"
          id="policies"
          className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
        >
          <h2
            id="cs-policies"
            className="mb-5 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3"
          >
            Policies
          </h2>
          <ul className="grid border-t border-Charcoal/20 sm:grid-cols-3">
            <li>
              <LocalizedClientLink
                href="/page/privacy-policy"
                className="block border-b border-Charcoal/20 py-5 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:text-RichGold sm:border-r sm:px-5"
              >
                Privacy Policy
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/page/terms-of-sale"
                className="block border-b border-Charcoal/20 py-5 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:text-RichGold sm:border-r sm:px-5"
              >
                Terms of Sale
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/page/terms-of-use"
                className="block border-b border-Charcoal/20 py-5 font-rexton text-h6 font-bold uppercase text-Charcoal transition-colors hover:text-RichGold sm:px-5"
              >
                Terms of Use
              </LocalizedClientLink>
            </li>
          </ul>
        </section>
        </main>
      </div>
    </div>
  )
}

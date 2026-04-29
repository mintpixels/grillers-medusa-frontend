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

  return (
    <div className="content-container py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 pb-6 border-b border-Charcoal/10">
          <h1 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal">
            {data.Title}
          </h1>
          <p className="mt-4 text-p-md text-Charcoal/80 max-w-2xl">
            {data.Intro}
          </p>
        </header>

        {/* Contact card */}
        <section
          aria-labelledby="cs-contact"
          className="mb-12 rounded-xl border border-Gold/20 bg-Scroll/30 p-6"
        >
          <h2 id="cs-contact" className="text-h4 font-gyst text-Charcoal mb-4">
            Get in touch
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-Charcoal/50 mb-1 font-maison-neue-mono">
                Phone
              </dt>
              <dd>
                <a
                  href={`tel:${phoneDigits}`}
                  className="text-Charcoal font-semibold hover:text-Gold"
                >
                  {data.ContactPhone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-Charcoal/50 mb-1 font-maison-neue-mono">
                Email
              </dt>
              <dd>
                <a
                  href={`mailto:${data.ContactEmail}`}
                  className="text-Charcoal font-semibold hover:text-Gold break-all"
                >
                  {data.ContactEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-Charcoal/50 mb-1 font-maison-neue-mono">
                Hours
              </dt>
              <dd className="text-Charcoal/80">{data.ContactHours}</dd>
            </div>
          </dl>
        </section>

        {/* Optional Strapi-driven body content */}
        {Array.isArray(data.Content) && data.Content.length > 0 && (
          <section className="mb-12 prose prose-Charcoal max-w-none font-maison-neue text-Charcoal/90 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_h2]:mt-8 [&_h2]:mb-3 [&_a]:text-Gold">
            <BlocksRenderer content={data.Content} />
          </section>
        )}

        {/* FAQ */}
        <section aria-labelledby="cs-faq" className="mb-12">
          <h2 id="cs-faq" className="text-h3-mobile md:text-h3 font-gyst text-Charcoal mb-6">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-Charcoal/10 border-t border-b border-Charcoal/10">
            {data.FAQs.map((faq, idx) => (
              <details key={idx} className="group py-4">
                <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                  <span className="text-p-md font-semibold text-Charcoal">
                    {faq.Question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-Gold transition-transform group-open:rotate-45 text-xl leading-none"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-p-sm text-Charcoal/80 leading-relaxed">
                  {faq.Answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Cross-links to legal */}
        <section
          aria-labelledby="cs-policies"
          className="pt-8 border-t border-Charcoal/10"
        >
          <h2 id="cs-policies" className="text-h4 font-gyst text-Charcoal mb-4">
            Policies
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-p-sm">
            <li>
              <LocalizedClientLink
                href="/page/privacy-policy"
                className="text-Gold hover:text-Gold/80 underline"
              >
                Privacy Policy
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/page/terms-of-sale"
                className="text-Gold hover:text-Gold/80 underline"
              >
                Terms of Sale
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/page/terms-of-use"
                className="text-Gold hover:text-Gold/80 underline"
              >
                Terms of Use
              </LocalizedClientLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import EmailPreferencesClient from "@modules/email-preferences/components/email-preferences-client"
import RequestLinkForm from "@modules/email-preferences/components/request-link-form"

export const metadata: Metadata = {
  title: "Email Preferences",
  description:
    "Manage what email Griller's Pride sends you, or unsubscribe with one click.",
  robots: { index: false, follow: false },
}

type Subscriber = {
  email: string
  status: "subscribed" | "unsubscribed"
  preferences: Record<string, unknown>
}

async function fetchSubscriber(token: string): Promise<Subscriber | null> {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(
      `${url.replace(/\/$/, "")}/api/preferences/${encodeURIComponent(token)}`,
      {
        headers: { "x-api-key": key },
        cache: "no-store",
      },
    )
    if (!r.ok) return null
    return (await r.json()) as Subscriber
  } catch (err) {
    console.error("[email-preferences] fetch failed:", err)
    return null
  }
}

type PageProps = {
  searchParams: Promise<{ t?: string }>
}

export default async function EmailPreferencesPage({ searchParams }: PageProps) {
  const { t } = await searchParams
  const token = typeof t === "string" && t.length > 0 ? t : null
  const subscriber = token ? await fetchSubscriber(token) : null

  return (
    <div className="pb-16">
      {/* Hero — mirrors the InfoPage hero shape so this page feels at home in
          the same /us/* surface (about, kashruth, customer-service, etc.). */}
      <section className="content-container pt-10 md:pt-16 pb-8 md:pb-12">
        <div className="max-w-2xl">
          <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.2em] text-Gold mb-3">
            Email
          </p>
          <h1 className="text-h1-mobile md:text-h1 font-gyst text-Charcoal leading-tight text-balance">
            Email preferences
          </h1>
          <p className="mt-5 text-p-lg font-maison-neue text-Charcoal/75 leading-[1.6] text-pretty">
            Manage what email we send you, or unsubscribe with one click.
          </p>
        </div>
      </section>

      <section className="content-container pb-12 md:pb-16">
        <div className="max-w-2xl">
          {token && subscriber ? (
            <EmailPreferencesClient token={token} initial={subscriber} />
          ) : token && !subscriber ? (
            <div className="border border-Charcoal/10 rounded-lg p-6 md:p-8 bg-Charcoal/[0.02]">
              <h2 className="font-gyst text-h4-mobile md:text-h4 text-Charcoal mb-3">
                Link not found
              </h2>
              <p className="font-maison-neue text-Charcoal/75">
                That preferences link looks invalid or has expired. Enter your
                email below and we&rsquo;ll send a fresh one.
              </p>
              <div className="mt-6">
                <RequestLinkForm />
              </div>
            </div>
          ) : (
            <div className="border border-Charcoal/10 rounded-lg p-6 md:p-8 bg-Charcoal/[0.02]">
              <h2 className="font-gyst text-h4-mobile md:text-h4 text-Charcoal mb-3">
                Get a preferences link
              </h2>
              <p className="font-maison-neue text-Charcoal/75 mb-6">
                Enter the email you subscribed with and we&rsquo;ll send you a
                link to manage your preferences.
              </p>
              <RequestLinkForm />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

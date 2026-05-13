export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import EmailPreferencesClient from "@modules/email-preferences/components/email-preferences-client"
import AccountSubscribeForm from "@modules/account/components/account-subscribe-form"

type Subscriber = {
  email: string
  status: "subscribed" | "unsubscribed"
  preferences: Record<string, unknown>
  token: string
}

async function lookup(email: string): Promise<Subscriber | null> {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/lookup`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({ email }),
      cache: "no-store",
    })
    if (!r.ok) return null
    const data = (await r.json()) as { subscriber: Subscriber | null }
    return data.subscriber
  } catch (err) {
    console.error("[account/email-subscription] lookup failed:", err)
    return null
  }
}

export default async function EmailSubscriptionPage() {
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) notFound()

  const subscriber = customer.email ? await lookup(customer.email) : null

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-3">
        <h1 className="text-2xl font-gyst text-Charcoal">Email Subscription</h1>
        <p className="font-maison-neue text-Charcoal/70">
          Manage email from Griller&rsquo;s Pride for{" "}
          <span className="font-semibold text-Charcoal">{customer.email}</span>.
          We email 2&ndash;3 times a year &mdash; usually before each holiday.
        </p>
      </div>

      {subscriber ? (
        <EmailPreferencesClient
          token={subscriber.token}
          initial={{
            email: subscriber.email,
            status: subscriber.status,
            preferences: subscriber.preferences,
          }}
        />
      ) : (
        <AccountSubscribeForm email={customer.email!} />
      )}
    </div>
  )
}

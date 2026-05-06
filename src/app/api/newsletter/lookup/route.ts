import { NextRequest, NextResponse } from "next/server"
import { retrieveCustomer } from "@lib/data/customer"

/**
 * Logged-in lookup: returns the current customer's newsletter subscription
 * status (or null if they're not subscribed). Auth-gated by the customer
 * session — we never accept an arbitrary email here, only the email on the
 * authenticated customer record. That keeps this endpoint from becoming a
 * subscriber-enumeration oracle.
 */
export const runtime = "nodejs"

export async function GET(_req: NextRequest) {
  const url = process.env.NEWSLETTER_SERVICE_URL
  const key = process.env.NEWSLETTER_API_KEY

  const customer = await retrieveCustomer().catch(() => null)
  if (!customer?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!url || !key) {
    return NextResponse.json({ subscriber: null }, { status: 200 })
  }

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/lookup`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({ email: customer.email }),
      cache: "no-store",
    })
    if (!r.ok) {
      return NextResponse.json({ subscriber: null }, { status: 200 })
    }
    const data = await r.json()
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error("[newsletter] lookup error:", err)
    return NextResponse.json({ subscriber: null }, { status: 200 })
  }
}

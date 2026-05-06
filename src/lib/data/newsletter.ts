"use server"

export type NewsletterResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Subscribe email to newsletter.
 *
 * Resolution order (first match wins):
 *  1. Self-hosted Griller's Pride newsletter service (#77) — when
 *     `NEWSLETTER_SERVICE_URL` + `NEWSLETTER_API_KEY` are set. This is the
 *     canonical path going forward; the storefront primarily talks to it
 *     through the `/api/newsletter/*` proxy routes, but this server action
 *     stays around for legacy callers.
 *  2. Klaviyo (`KLAVIYO_API_KEY` + `KLAVIYO_LIST_ID`).
 *  3. Mailchimp (`MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` + `MAILCHIMP_SERVER`).
 *  4. Console log fallback (dev/test).
 */
export async function subscribeToNewsletter(
  email: string,
  source?: string
): Promise<NewsletterResult> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." }
  }

  // Self-hosted service (#77). Server action context: no request headers are
  // available here for IP/UA, so the audit log will fall back to whatever
  // the service can extract from the proxy hop. Real subscriber metadata is
  // captured on the proxy route (`src/app/api/newsletter/subscribe/route.ts`).
  const newsletterUrl = process.env.NEWSLETTER_SERVICE_URL
  const newsletterKey = process.env.NEWSLETTER_API_KEY
  if (newsletterUrl && newsletterKey) {
    return subscribeViaSelfHosted(email, newsletterUrl, newsletterKey, source)
  }

  // Check for Klaviyo integration
  const klaviyoApiKey = process.env.KLAVIYO_API_KEY
  const klaviyoListId = process.env.KLAVIYO_LIST_ID

  if (klaviyoApiKey && klaviyoListId) {
    return subscribeViaKlaviyo(email, klaviyoApiKey, klaviyoListId, source)
  }

  // Check for Mailchimp integration
  const mailchimpApiKey = process.env.MAILCHIMP_API_KEY
  const mailchimpListId = process.env.MAILCHIMP_LIST_ID
  const mailchimpServer = process.env.MAILCHIMP_SERVER

  if (mailchimpApiKey && mailchimpListId && mailchimpServer) {
    return subscribeViaMailchimp(email, mailchimpApiKey, mailchimpListId, mailchimpServer, source)
  }

  // Fallback: Log subscription (for development/testing)
  console.log(`[Newsletter] New subscription: ${email} (source: ${source || "unknown"})`)

  return {
    success: true,
    message: "Thank you for subscribing!",
  }
}

/**
 * Subscribe via the self-hosted Griller's Pride newsletter service.
 */
async function subscribeViaSelfHosted(
  email: string,
  serviceUrl: string,
  apiKey: string,
  source?: string,
): Promise<NewsletterResult> {
  try {
    const r = await fetch(`${serviceUrl.replace(/\/$/, "")}/api/subscribe`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        email,
        source: source || null,
        // No request context here — leave URL/consent_version null. The
        // browser-facing flow goes through the proxy route which DOES
        // populate these.
        consent_version: "v1-2026-05",
      }),
      cache: "no-store",
    })
    if (!r.ok) {
      const errorData = await r.json().catch(() => ({}))
      console.error("[Newsletter] self-hosted subscribe error:", errorData)
      return {
        success: false,
        error: "Unable to subscribe. Please try again later.",
      }
    }
    return { success: true, message: "Thank you for subscribing!" }
  } catch (error) {
    console.error("[Newsletter] self-hosted subscribe error:", error)
    return {
      success: false,
      error: "Unable to subscribe. Please try again later.",
    }
  }
}

/**
 * Subscribe via Klaviyo API
 */
async function subscribeViaKlaviyo(
  email: string,
  apiKey: string,
  listId: string,
  source?: string
): Promise<NewsletterResult> {
  try {
    const response = await fetch(
      `https://a.klaviyo.com/api/v2/list/${listId}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
        },
        body: JSON.stringify({
          profiles: [
            {
              email,
              ...(source && { $source: source }),
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[Klaviyo] Subscription error:", errorData)
      return {
        success: false,
        error: "Unable to subscribe. Please try again later.",
      }
    }

    return {
      success: true,
      message: "Thank you for subscribing!",
    }
  } catch (error) {
    console.error("[Klaviyo] Subscription error:", error)
    return {
      success: false,
      error: "Unable to subscribe. Please try again later.",
    }
  }
}

/**
 * Subscribe via Mailchimp API
 */
async function subscribeViaMailchimp(
  email: string,
  apiKey: string,
  listId: string,
  server: string,
  source?: string
): Promise<NewsletterResult> {
  try {
    const response = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          ...(source && {
            merge_fields: {
              SOURCE: source,
            },
          }),
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle "already subscribed" as success
      if (errorData.title === "Member Exists") {
        return {
          success: true,
          message: "You're already subscribed!",
        }
      }

      console.error("[Mailchimp] Subscription error:", errorData)
      return {
        success: false,
        error: "Unable to subscribe. Please try again later.",
      }
    }

    return {
      success: true,
      message: "Thank you for subscribing!",
    }
  } catch (error) {
    console.error("[Mailchimp] Subscription error:", error)
    return {
      success: false,
      error: "Unable to subscribe. Please try again later.",
    }
  }
}

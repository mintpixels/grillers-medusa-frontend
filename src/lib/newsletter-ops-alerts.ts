import { emitStorefrontOpsAlert } from "@lib/ops-alert"

export type NewsletterProxyFlow =
  | "subscribe"
  | "request_preferences_link"
  | "unsubscribe"
  | "preferences_get"
  | "preferences_patch"
  | "lookup"

export type NewsletterProxyFailureStage =
  | "configuration"
  | "upstream_response"
  | "transport"

type NewsletterProxyFailureInput = {
  flow: NewsletterProxyFlow
  stage: NewsletterProxyFailureStage
  path: string
  missingEnv?: string[]
  status?: number
  statusText?: string
  error?: unknown
}

function redactedMessage(value: unknown): string | null {
  if (value === null || value === undefined) return null

  const raw =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : (() => {
            try {
              return JSON.stringify(value)
            } catch {
              return String(value)
            }
          })()

  const redacted = raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\s+/g, " ")
    .trim()

  return redacted ? redacted.slice(0, 500) : null
}

async function safeEmitStorefrontOpsAlert(
  input: Parameters<typeof emitStorefrontOpsAlert>[0]
) {
  try {
    await emitStorefrontOpsAlert(input)
  } catch {
    // Fail open: newsletter proxy behavior must not depend on alert delivery.
  }
}

export function shouldAlertNewsletterProxyStatus(status: number): boolean {
  return status === 401 || status === 403 || status >= 500
}

export function missingNewsletterProxyEnv(): string[] {
  return ["NEWSLETTER_SERVICE_URL", "NEWSLETTER_API_KEY"].filter(
    (name) => !process.env[name]
  )
}

export async function emitNewsletterProxyFailureAlert({
  flow,
  stage,
  path,
  missingEnv = [],
  status,
  statusText,
  error,
}: NewsletterProxyFailureInput) {
  await safeEmitStorefrontOpsAlert({
    alertKind: "newsletter_proxy_failed",
    severity: "warn",
    title:
      stage === "configuration"
        ? `Newsletter ${flow} proxy misconfigured: ${missingEnv.join(", ")}`
        : `Newsletter ${flow} proxy ${stage} failed${status ? ` (${status})` : ""}`,
    path,
    source: "storefront-server",
    fingerprint: `newsletter_proxy:${flow}:${stage}:${status || "unknown"}`,
    meta: {
      newsletter_flow: flow,
      stage,
      missing_env: missingEnv,
      status: status || null,
      status_text: statusText || null,
      error_message: redactedMessage(error),
    },
  })
}

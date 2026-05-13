/**
 * Tiny Postmark client used by transactional flows on the storefront —
 * review-acquisition (#96) and notify-when-back-in-stock (#102).
 *
 * Why not the official `postmark` npm package? Two reasons:
 *   1. It pulls in a runtime dependency (~150 kB minified) for two
 *      simple HTTP calls.
 *   2. The official package adds Node.js-only deps that interact
 *      awkwardly with Next.js's bundler on the Server Action path.
 *
 * The REST API surface we use is the documented public API; calling
 * `fetch` directly is stable.
 *
 * Env vars (set in Vercel + grillers-medusa-frontend/.env):
 *   - `POSTMARK_SERVER_TOKEN` — Server API token (Postmark dashboard).
 *   - `POSTMARK_DEFAULT_FROM` — default `From` address, e.g.
 *     `hello@grillerspride.com`. Postmark rejects sends from unverified
 *     domains; coordinate verification with Chris before flipping new
 *     domains on.
 *   - `POSTMARK_DEFAULT_STREAM` — usually `outbound` for transactional.
 */

const POSTMARK_BASE = "https://api.postmarkapp.com"

type SendEmailInput = {
  to: string
  subject: string
  htmlBody?: string
  textBody?: string
  /** Override the default sender. Must be a verified Postmark sender. */
  from?: string
  /** Reply-to header (optional). */
  replyTo?: string
  /** Override the default outbound stream (e.g. for broadcasts). */
  messageStream?: string
  /** Tag for Postmark dashboard filtering / analytics. */
  tag?: string
  /** Arbitrary string metadata recorded with the message. */
  metadata?: Record<string, string>
}

type SendEmailTemplateInput = {
  to: string
  templateAlias: string
  templateModel: Record<string, unknown>
  from?: string
  replyTo?: string
  messageStream?: string
  tag?: string
  metadata?: Record<string, string>
}

export type PostmarkSendResult = {
  ok: boolean
  messageId?: string
  errorCode?: number
  message?: string
}

type PostmarkConfig = {
  token: string
  from: string
  stream: string
}

function getConfig(): PostmarkConfig | { error: string } {
  // Soft-fail (return an error object) rather than throw so callers
  // can return `{ok:false}` cleanly. Throwing here used to crash the
  // server action / cron route outside its try-block when the env var
  // was missing (Codex review on #102/#96).
  const token = process.env.POSTMARK_SERVER_TOKEN
  if (!token) {
    return {
      error:
        "POSTMARK_SERVER_TOKEN missing — cannot send transactional email.",
    }
  }
  const from = process.env.POSTMARK_DEFAULT_FROM || "hello@grillerspride.com"
  const stream = process.env.POSTMARK_DEFAULT_STREAM || "outbound"
  return { token, from, stream }
}

async function postmarkRequest<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const cfg = getConfig()
  if ("error" in cfg) {
    throw new Error(cfg.error)
  }
  const { token } = cfg
  const res = await fetch(`${POSTMARK_BASE}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify(body),
    // Postmark sends are server-only; never cache.
    cache: "no-store",
  })
  const json = (await res.json().catch(() => ({}))) as T & {
    ErrorCode?: number
    Message?: string
  }
  if (!res.ok) {
    throw new Error(
      `Postmark ${path} ${res.status}: ${json.Message || res.statusText}`
    )
  }
  return json
}

/**
 * Send a one-off email with inline HTML / text bodies.
 *
 * Prefer `sendTemplatedEmail` for any flow that's customer-facing —
 * the Postmark dashboard is the single source of layout/copy for
 * those, which makes editorial iteration painless.
 */
export async function sendEmail(input: SendEmailInput): Promise<PostmarkSendResult> {
  try {
    const cfg = getConfig()
    if ("error" in cfg) {
      return { ok: false, message: cfg.error }
    }
    const { from, stream } = cfg
    const json = await postmarkRequest<{ MessageID: string }>("/email", {
      From: input.from ?? from,
      To: input.to,
      Subject: input.subject,
      HtmlBody: input.htmlBody,
      TextBody: input.textBody,
      ReplyTo: input.replyTo,
      MessageStream: input.messageStream ?? stream,
      Tag: input.tag,
      Metadata: input.metadata,
    })
    return { ok: true, messageId: json.MessageID }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Send a Postmark template by alias. The template + layout live in the
 * Postmark dashboard; `templateModel` is the keyed substitution data.
 *
 * Aliases used in this codebase:
 *   - `review-acquisition`        — #96 post-purchase review request
 *   - `back-in-stock-confirm`     — #102 "we'll let you know" confirm
 *   - `back-in-stock-restocked`   — #102 "this product is back" trigger
 */
export async function sendTemplatedEmail(
  input: SendEmailTemplateInput
): Promise<PostmarkSendResult> {
  try {
    const cfg = getConfig()
    if ("error" in cfg) {
      return { ok: false, message: cfg.error }
    }
    const { from, stream } = cfg
    const json = await postmarkRequest<{ MessageID: string }>(
      "/email/withTemplate",
      {
        From: input.from ?? from,
        To: input.to,
        TemplateAlias: input.templateAlias,
        TemplateModel: input.templateModel,
        ReplyTo: input.replyTo,
        MessageStream: input.messageStream ?? stream,
        Tag: input.tag,
        Metadata: input.metadata,
      }
    )
    return { ok: true, messageId: json.MessageID }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

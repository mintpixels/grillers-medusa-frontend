#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const POSTMARK_BASE = "https://api.postmarkapp.com"
const apply = process.argv.includes("--apply")
const updateExisting = process.argv.includes("--update-existing")

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[match[1]] = value
  }
}

function template({
  name,
  alias,
  subject,
  preview,
  body,
  ctaText,
  ctaUrl,
  footer,
  textBody,
}) {
  const htmlBody = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8f5ef;color:#262626;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f5ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e6ddcd;">
            <tr>
              <td style="padding:28px 28px 12px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9b741f;font-weight:700;">
                Griller's Pride
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 6px;font-size:28px;line-height:1.12;font-weight:700;color:#262626;">
                ${preview}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 4px;font-size:16px;line-height:1.55;color:#3d3d3d;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 24px;">
                <a href="${ctaUrl}" style="display:inline-block;background:#e0b963;color:#262626;text-decoration:none;font-size:13px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;padding:15px 22px;border:1px solid #262626;border-radius:5px;">
                  ${ctaText}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;font-size:13px;line-height:1.55;color:#6b7280;">
                ${footer}
                <br /><br />
                <a href="{{unsubscribe_url}}" style="color:#6b7280;">Unsubscribe from this email</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return {
    Name: name,
    Alias: alias,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
    TemplateType: "Standard",
  }
}

const templates = [
  template({
    name: "Back in stock confirm",
    alias: "back-in-stock-confirm",
    subject: "We'll let you know - {{product_title}}",
    preview: "You're on the list.",
    body:
      "<p>We have your request for <strong>{{product_title}}</strong>.</p><p>When this cut is back in stock, we will email you here. You can revisit the product any time from the link below.</p><p style=\"font-size:13px;color:#6b7280;\">Product handle: {{product_handle}}</p>",
    ctaText: "View product",
    ctaUrl: "{{product_url}}",
    footer: "You are receiving this because you asked to be notified when this product returns.",
    textBody:
      "You're on the list for {{product_title}}.\n\nProduct handle: {{product_handle}}\nProduct: {{product_url}}\n\nUnsubscribe: {{unsubscribe_url}}",
  }),
  template({
    name: "Back in stock restocked",
    alias: "back-in-stock-restocked",
    subject: "{{product_title}} is back in stock at Griller's Pride",
    preview: "This cut is back.",
    body:
      "<p><strong>{{product_title}}</strong> is available again.</p><p>Inventory can move quickly, so use the link below if you still want it for your next order.</p>",
    ctaText: "Shop now",
    ctaUrl: "{{product_url}}",
    footer: "You are receiving this because you asked us to notify you when this product returned.",
    textBody:
      "{{product_title}} is back in stock.\n\nShop now: {{product_url}}\n\nUnsubscribe: {{unsubscribe_url}}",
  }),
  template({
    name: "Review ask - first time Google",
    alias: "review-google-first-time",
    subject: "Quick favor - would you leave us a review?",
    preview: "How was {{order_summary}}?",
    body:
      "<p>Hi {{first_name}},</p><p>Hope your order was good. If it was, would you leave us a Google review? Two sentences is enough: what you ordered, and what you would tell a friend.</p><p>Real customer voices help families find us, especially where no kosher butcher exists locally.</p>",
    ctaText: "Leave a Google review",
    ctaUrl: "{{google_review_url}}",
    footer: "Thanks,<br />Peter Swerdlow<br />Griller's Pride",
    textBody:
      "Hi {{first_name}},\n\nHope your order was good. If it was, would you leave us a Google review? Two sentences is enough: what you ordered, and what you would tell a friend.\n\nLeave a Google review: {{google_review_url}}\n\nThanks,\nPeter Swerdlow\nGriller's Pride\n\nUnsubscribe: {{unsubscribe_url}}",
  }),
  template({
    name: "Review ask - repeat Google",
    alias: "review-google-repeat",
    subject: "Would you leave Griller's Pride a review?",
    preview: "Thanks for ordering again.",
    body:
      "<p>Hi {{first_name}},</p><p>You have ordered from us before - thank you. If you have been meaning to leave a Google review and have not, would you take 60 seconds today?</p><p>Repeat customers are the strongest signal for new families considering us.</p>",
    ctaText: "Leave a Google review",
    ctaUrl: "{{google_review_url}}",
    footer: "Thanks,<br />Peter Swerdlow<br />Griller's Pride",
    textBody:
      "Hi {{first_name}},\n\nYou have ordered from us before - thank you. If you have been meaning to leave a Google review and have not, would you take 60 seconds today?\n\nLeave a Google review: {{google_review_url}}\n\nThanks,\nPeter Swerdlow\nGriller's Pride\n\nUnsubscribe: {{unsubscribe_url}}",
  }),
  template({
    name: "Review ask - Atlanta Yelp followup",
    alias: "review-yelp-atlanta-followup",
    subject: "One more - Yelp this time?",
    preview: "One last local-review ask.",
    body:
      "<p>Hi {{first_name}},</p><p>A few weeks ago you may have left us a Google review. Thank you if so.</p><p>Atlanta has a meaningful Yelp community for local food businesses. If you would take 30 seconds to leave a Yelp review too, it goes a long way.</p><p>Last ask, promise.</p>",
    ctaText: "Leave a Yelp review",
    ctaUrl: "{{yelp_review_url}}",
    footer: "Thanks,<br />Peter Swerdlow<br />Griller's Pride",
    textBody:
      "Hi {{first_name}},\n\nA few weeks ago you may have left us a Google review. Thank you if so.\n\nAtlanta has a meaningful Yelp community for local food businesses. If you would take 30 seconds to leave a Yelp review too, it goes a long way.\n\nLeave a Yelp review: {{yelp_review_url}}\n\nLast ask, promise.\n\nPeter\n\nUnsubscribe: {{unsubscribe_url}}",
  }),
]

async function postmark(path, options = {}) {
  const token = process.env.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_API_TOKEN
  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN missing")
  }
  const res = await fetch(`${POSTMARK_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
      ...(options.headers || {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Postmark ${path} ${res.status}: ${json.Message || res.statusText}`)
  }
  return json
}

async function main() {
  loadDotEnv()
  const list = await postmark("/templates?count=500&offset=0", { method: "GET" })
  const byAlias = new Map((list.Templates || []).map((item) => [item.Alias, item]))

  for (const spec of templates) {
    const existing = byAlias.get(spec.Alias)
    if (!existing) {
      if (!apply) {
        console.log(`missing ${spec.Alias} (dry run)`)
        continue
      }
      await postmark("/templates", {
        method: "POST",
        body: JSON.stringify(spec),
      })
      console.log(`created ${spec.Alias}`)
      continue
    }

    if (apply && updateExisting) {
      await postmark(`/templates/${existing.TemplateId}`, {
        method: "PUT",
        body: JSON.stringify(spec),
      })
      console.log(`updated ${spec.Alias}`)
    } else {
      console.log(`exists ${spec.Alias}`)
    }
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

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

loadDotEnv()

const STOREFRONT_URL = (
  process.env.STOREFRONT_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://grillers-medusa-frontend.vercel.app"
).replace(/\/+$/, "")
const BRAND_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  `${STOREFRONT_URL}/images/logos/logo-horizontal.png`

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
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta name="x-apple-disable-message-reformatting"/>
    <title>${preview}</title>
    <style>
      @media only screen and (max-width:620px){
        .email-container{width:100% !important;}
        .email-padding{padding-left:20px !important;padding-right:20px !important;}
        .brand-logo{width:220px !important;height:auto !important;}
      }
      a { color:#0B5A43; }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#F7F3EA;color:#2A2828;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;font-size:1px;color:#F7F3EA;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F3EA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#FAF8F3;border:1px solid #E4DED2;border-radius:8px;overflow:hidden;">
            <tr>
              <td align="center" style="background:#FAF8F3;padding:26px 40px;border-bottom:1px solid #E4DED2;text-align:center;">
                <a href="${STOREFRONT_URL}" style="display:inline-block;text-decoration:none;">
                  <img class="brand-logo" src="${BRAND_LOGO_URL}" width="256" height="24" alt="Griller's Pride" style="display:block;width:256px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;"/>
                </a>
                <div style="font-size:11px;letter-spacing:0;text-transform:uppercase;color:#A97838;font-weight:700;margin-top:10px;">Premium Kosher Meats</div>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:36px 40px 8px 40px;">
                <div style="font-size:11px;letter-spacing:0;text-transform:uppercase;color:#A97838;font-weight:700;margin-bottom:12px;">Griller's Pride</div>
                <h1 style="margin:0;font-size:28px;line-height:1.25;color:#17201A;font-weight:700;letter-spacing:0;">${preview}</h1>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:16px 40px 4px;font-size:16px;line-height:1.6;color:#2A2828;">
                ${body}
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:22px 40px 28px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#0B5A43" style="border-radius:4px;background:#0B5A43;">
                      <a class="button-link" href="${ctaUrl}" target="_blank" style="display:inline-block;background:#0B5A43;border:1px solid #0B5A43;padding:14px 32px;font-size:15px;line-height:1.2;font-weight:700;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF;text-decoration:none;border-radius:4px;letter-spacing:0;">
                        <span style="color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF;text-decoration:none;">${ctaText}</span>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:0 40px 32px;">
                <div style="background:#FBFAF6;border:1px solid #E4DED2;border-radius:6px;padding:18px 20px;font-size:13px;line-height:1.6;color:#2A2828;">
                  ${footer}
                  <br /><br />
                  <a href="{{unsubscribe_url}}" style="color:#6F665B;text-decoration:underline;">Unsubscribe from this email</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#F7F3EA;padding:28px 40px;text-align:center;">
                <div style="font-size:13px;color:#6F665B;line-height:1.6;">
                  Questions? <a href="mailto:peter@grillerspride.com" style="color:#0B5A43;text-decoration:none;font-weight:600;">peter@grillerspride.com</a> &nbsp;|&nbsp; <a href="tel:7704548108" style="color:#0B5A43;text-decoration:none;font-weight:600;">(770) 454-8108</a>
                </div>
                <div style="font-size:11px;color:#6F665B;margin-top:14px;letter-spacing:0;">
                  &copy; Griller's Pride &middot; <a href="${STOREFRONT_URL}" style="color:#6F665B;text-decoration:none;">grillerspride.com</a>
                </div>
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

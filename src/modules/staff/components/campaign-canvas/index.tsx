"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import "grapesjs/dist/css/grapes.min.css"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  createCommunicationCampaign,
  saveCommunicationTemplate,
  sendCommunicationCampaign,
  type CommunicationSegment,
  type CommunicationTemplate,
} from "@lib/data/staff/communications"

type Props = {
  countryCode: string
  staffEmail: string
  segments: CommunicationSegment[]
  templates: CommunicationTemplate[]
}

/**
 * The GP Comms campaign canvas: GrapesJS + MJML, loaded client-side only
 * (the editor is ~1MB and window-bound). Designs save as gp_email_template
 * rows (compiled HTML + MJML source + the editor's project JSON so a
 * template reopens exactly as left). The right rail drives the ship path:
 * save → test send → create campaign against a segment. Every send
 * inherits the platform rules (Shabbat blackout, frequency caps, consent,
 * >500-recipient Slack approval) server-side — nothing here can bypass
 * them.
 */
const GP_NAVY = "#2D479D"
const GP_CREAM = "#faf6ee"

const STARTER_MJML = `
<mjml>
  <mj-body background-color="${GP_CREAM}">
    <mj-section background-color="${GP_NAVY}" padding="18px">
      <mj-column>
        <mj-text align="center" color="#ffffff" font-size="20px" font-weight="700" letter-spacing="2px">
          GRILLER'S ★ PRIDE
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="28px 24px 8px">
      <mj-column>
        <mj-text font-size="24px" font-weight="700" color="#1a2021">
          Hi {{first_name}},
        </mj-text>
        <mj-text font-size="15px" line-height="1.6" color="#374151">
          Start writing here — drag blocks from the left to build your email.
        </mj-text>
        <mj-button background-color="${GP_NAVY}" color="#ffffff" font-weight="600" href="https://grillers-medusa-frontend.vercel.app/us/store" border-radius="24px">
          Shop the counter
        </mj-button>
      </mj-column>
    </mj-section>
    <mj-section background-color="${GP_CREAM}" padding="20px 24px">
      <mj-column>
        <mj-text align="center" font-size="11px" color="#6b7280" line-height="1.6">
          Griller's Pride · 3939 McElroy Road, Doraville, GA 30340 · (770) 454-8108
          <br/>You're receiving this because you opted in at getgrillerspride.com.
          <br/><a href="{{{ pm:unsubscribe }}}" style="color:#6b7280;">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`

function registerGpBlocks(editor: any) {
  const bm = editor.BlockManager
  const category = "Griller's Pride"

  bm.add("gp-hero", {
    label: "Hero banner",
    category,
    content: `
      <mj-section background-color="${GP_NAVY}" padding="26px">
        <mj-column>
          <mj-text align="center" color="#ffffff" font-size="26px" font-weight="700">Holiday cuts are here</mj-text>
          <mj-text align="center" color="#c7d2ea" font-size="14px">Reserve early — the smokehouse fills fast.</mj-text>
        </mj-column>
      </mj-section>`,
  })

  bm.add("gp-product-card", {
    label: "Product card",
    category,
    content: `
      <mj-section background-color="#ffffff" padding="16px 24px">
        <mj-column width="35%">
          <mj-image src="https://grillers-medusa-frontend.vercel.app/images/sms-opt-in-web-form.png" alt="Product" border-radius="10px" />
        </mj-column>
        <mj-column width="65%" vertical-align="middle">
          <mj-text font-size="17px" font-weight="700" color="#1a2021">First-Cut Brisket</mj-text>
          <mj-text font-size="14px" color="#374151">Untrimmed, 6–7 lb · $18.99/lb</mj-text>
          <mj-button background-color="${GP_NAVY}" color="#ffffff" font-size="13px" border-radius="20px" align="left" href="https://grillers-medusa-frontend.vercel.app/us/store">
            Add to cart
          </mj-button>
        </mj-column>
      </mj-section>`,
  })

  bm.add("gp-countdown", {
    label: "Holiday countdown",
    category,
    content: `
      <mj-section background-color="#fff7ed" padding="14px 24px">
        <mj-column>
          <mj-text align="center" font-size="15px" font-weight="700" color="#9a3412">
            🕯️ Order by Wednesday 2pm for pre-Shabbos delivery
          </mj-text>
        </mj-column>
      </mj-section>`,
  })

  bm.add("gp-ship-cutoff", {
    label: "Ship-cutoff banner",
    category,
    content: `
      <mj-section background-color="#ecfdf5" padding="12px 24px">
        <mj-column>
          <mj-text align="center" font-size="13px" color="#065f46">
            📦 National orders ship Mon–Wed on ice — order by Sunday night to make this week's truck.
          </mj-text>
        </mj-column>
      </mj-section>`,
  })

  bm.add("gp-b2b-terms", {
    label: "B2B terms note",
    category,
    content: `
      <mj-section background-color="#eef2ff" padding="14px 24px">
        <mj-column>
          <mj-text font-size="14px" color="#312e81">
            <strong>Institutional accounts:</strong> order on Net-10 terms with pay-by-invoice at checkout. Standing weekly orders available — reply to set one up.
          </mj-text>
        </mj-column>
      </mj-section>`,
  })

  bm.add("gp-footer", {
    label: "Footer + unsubscribe",
    category,
    content: `
      <mj-section background-color="${GP_CREAM}" padding="20px 24px">
        <mj-column>
          <mj-text align="center" font-size="11px" color="#6b7280" line-height="1.6">
            Griller's Pride · 3939 McElroy Road, Doraville, GA 30340 · (770) 454-8108
            <br/><a href="{{{ pm:unsubscribe }}}" style="color:#6b7280;">Unsubscribe</a>
          </mj-text>
        </mj-column>
      </mj-section>`,
  })
}

const CampaignCanvas = ({ countryCode, staffEmail, segments, templates }: Props) => {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [templateKey, setTemplateKey] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [subject, setSubject] = useState("")
  const [segmentKey, setSegmentKey] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [testEmail, setTestEmail] = useState(staffEmail)
  const [savedVersion, setSavedVersion] = useState<number | null>(null)

  useEffect(() => {
    let editor: any
    let cancelled = false
    ;(async () => {
      const [{ default: grapesjs }, { default: mjmlPlugin }] = await Promise.all([
        import("grapesjs"),
        import("grapesjs-mjml"),
      ])
      if (cancelled || !containerRef.current) return

      editor = grapesjs.init({
        container: containerRef.current,
        height: "100%",
        fromElement: false,
        storageManager: false,
        plugins: [mjmlPlugin],
        pluginsOpts: { [mjmlPlugin as any]: {} },
      })
      editor.setComponents(STARTER_MJML)
      registerGpBlocks(editor)
      editorRef.current = editor
      setReady(true)
    })()
    return () => {
      cancelled = true
      try {
        editor?.destroy?.()
      } catch {
        // editor teardown is best-effort
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const compile = useCallback((): { mjml: string; html: string } | null => {
    const editor = editorRef.current
    if (!editor) return null
    const mjml = editor.getHtml() || ""
    // grapesjs-mjml registers an mjml command that returns compiled HTML.
    const result = editor.runCommand("mjml-code-to-html") ||
      editor.runCommand("gjs-get-mjml-html") || {}
    let html = typeof result === "string" ? result : result?.html || ""
    if (!html) {
      // Fallback: some plugin versions expose the compiler differently.
      try {
        html = editor.runCommand("mjml-get-code")?.html || ""
      } catch {
        html = ""
      }
    }
    if (!html) return null
    return { mjml, html }
  }, [])

  const loadTemplate = useCallback((template: CommunicationTemplate & { metadata?: any }) => {
    setTemplateKey(template.key)
    setTemplateName(template.name)
    setSubject(template.subject)
    setStatus(`Loaded "${template.name}" — edits save a new version.`)
  }, [])

  const onSave = async () => {
    const compiled = compile()
    if (!compiled) {
      setStatus("Could not compile the design — check for invalid blocks.")
      return null
    }
    if (!templateKey.trim() || !subject.trim()) {
      setStatus("Template key and subject are required.")
      return null
    }
    setBusy(true)
    setStatus(null)
    try {
      const result = await saveCommunicationTemplate({
        key: templateKey,
        name: templateName || templateKey,
        subject,
        html_body: compiled.html,
        mjml_source: compiled.mjml,
        canvas_project: editorRef.current?.getProjectData?.() ?? null,
        message_stream: "broadcast",
      })
      setSavedVersion(result.template.version)
      setStatus(`Saved "${result.template.key}" v${result.template.version}.`)
      return result.template
    } catch (error: any) {
      setStatus(`Save failed: ${error?.message || "unknown error"}`)
      return null
    } finally {
      setBusy(false)
    }
  }

  const onTestSend = async () => {
    const template = await onSave()
    if (!template) return
    if (!testEmail.trim()) {
      setStatus("Enter a test email address.")
      return
    }
    setBusy(true)
    try {
      const campaign = await createCommunicationCampaign({
        name: `${templateName || templateKey} (canvas)`,
        subject,
        segment_key: segmentKey || undefined,
        body: "",
        template_key: template.key,
      })
      await sendCommunicationCampaign(campaign.campaign.id, {
        test_email: testEmail,
      })
      setStatus(`Test sent to ${testEmail} (template v${template.version}).`)
    } catch (error: any) {
      setStatus(`Test send failed: ${error?.message || "unknown error"}`)
    } finally {
      setBusy(false)
    }
  }

  const onCreateCampaign = async () => {
    const template = await onSave()
    if (!template) return
    if (!segmentKey) {
      setStatus("Pick a segment for the campaign audience.")
      return
    }
    setBusy(true)
    try {
      const campaign = await createCommunicationCampaign({
        name: templateName || templateKey,
        subject,
        segment_key: segmentKey,
        body: "",
        scheduled_at: scheduledAt || undefined,
        template_key: template.key,
      })
      setStatus(
        scheduledAt
          ? `Campaign scheduled (${campaign.campaign.id}). Shabbat blackout + approvals apply automatically.`
          : `Campaign created as draft (${campaign.campaign.id}) — send it from the Campaigns tab. Audiences over 500 will request Slack approval.`
      )
    } catch (error: any) {
      setStatus(`Campaign create failed: ${error?.message || "unknown error"}`)
    } finally {
      setBusy(false)
    }
  }

  const canvasTemplates = templates.filter((t) => t.key !== "campaign-simple")

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[640px] flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-semibold text-ui-fg-base">Campaign Canvas</h1>
          <p className="text-small-regular text-ui-fg-subtle">
            Drag blocks, save as a template, test to yourself, then ship to a segment.
          </p>
        </div>
        <LocalizedClientLink
          href="/account/staff/communications"
          className="text-small-regular underline underline-offset-4"
        >
          ← Back to console
        </LocalizedClientLink>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-ui-border-base bg-white">
          {!ready ? (
            <div className="flex h-full items-center justify-center text-ui-fg-subtle">
              Loading the canvas…
            </div>
          ) : null}
          <div ref={containerRef} className={ready ? "h-full" : "h-0"} />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
          <section className="flex flex-col gap-2">
            <h2 className="text-base-semi text-ui-fg-base">Template</h2>
            <label className="text-xs text-ui-fg-subtle">
              Key
              <input
                className="mt-1 w-full rounded-md border border-ui-border-base px-2 py-1.5 text-sm"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                placeholder="weekly-specials"
                data-testid="canvas-template-key"
              />
            </label>
            <label className="text-xs text-ui-fg-subtle">
              Name
              <input
                className="mt-1 w-full rounded-md border border-ui-border-base px-2 py-1.5 text-sm"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Weekly specials"
              />
            </label>
            <label className="text-xs text-ui-fg-subtle">
              Subject
              <input
                className="mt-1 w-full rounded-md border border-ui-border-base px-2 py-1.5 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="This week at the butcher counter"
                data-testid="canvas-subject"
              />
            </label>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={busy || !ready}
              className="rounded-full bg-ui-fg-base px-4 py-2 text-sm font-semibold text-ui-bg-base disabled:opacity-50"
              data-testid="canvas-save"
            >
              {busy ? "Working…" : savedVersion ? `Save (v${savedVersion + 1})` : "Save template"}
            </button>
            {canvasTemplates.length ? (
              <details className="text-xs text-ui-fg-subtle">
                <summary className="cursor-pointer">Existing canvas templates</summary>
                <ul className="mt-1 flex flex-col gap-1">
                  {canvasTemplates.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="underline underline-offset-2"
                        onClick={() => loadTemplate(t)}
                      >
                        {t.name} (v{t.version})
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>

          <section className="flex flex-col gap-2 border-t border-ui-border-base pt-3">
            <h2 className="text-base-semi text-ui-fg-base">Test send</h2>
            <input
              className="w-full rounded-md border border-ui-border-base px-2 py-1.5 text-sm"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@grillerspride.com"
              data-testid="canvas-test-email"
            />
            <button
              type="button"
              onClick={() => void onTestSend()}
              disabled={busy || !ready}
              className="rounded-full border border-ui-fg-base px-4 py-2 text-sm font-semibold disabled:opacity-50"
              data-testid="canvas-test-send"
            >
              Send test to me
            </button>
          </section>

          <section className="flex flex-col gap-2 border-t border-ui-border-base pt-3">
            <h2 className="text-base-semi text-ui-fg-base">Ship it</h2>
            <label className="text-xs text-ui-fg-subtle">
              Audience segment
              <select
                className="mt-1 w-full rounded-md border border-ui-border-base px-2 py-1.5 text-sm"
                value={segmentKey}
                onChange={(e) => setSegmentKey(e.target.value)}
                data-testid="canvas-segment"
              >
                <option value="">Choose a segment…</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.key}>
                    {segment.name}
                    {typeof segment.cached_count === "number"
                      ? ` (~${segment.cached_count.toLocaleString()})`
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ui-fg-subtle">
              Schedule (optional — blackouts auto-defer)
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border border-ui-border-base px-2 py-1.5 text-sm"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => void onCreateCampaign()}
              disabled={busy || !ready}
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              data-testid="canvas-create-campaign"
            >
              Create campaign
            </button>
            <p className="text-[11px] leading-relaxed text-ui-fg-subtle">
              Server rules always apply: Shabbat/Yom Tov blackout, weekly
              frequency caps, consent checks, and Slack approval for audiences
              over 500.
            </p>
          </section>

          {status ? (
            <p
              className="border-t border-ui-border-base pt-3 text-xs text-ui-fg-base"
              data-testid="canvas-status"
            >
              {status}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export default CampaignCanvas

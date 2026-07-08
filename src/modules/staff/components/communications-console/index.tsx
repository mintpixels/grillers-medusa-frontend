"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Database,
  FileText,
  Clock3,
  Mail,
  MousePointerClick,
  Play,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  createCommunicationCampaign,
  createCommunicationSegment,
  getCommunicationProfileTimeline,
  importConstantContactRows,
  previewCommunicationSegment,
  runCommunicationFlowsNow,
  searchCommunicationProfiles,
  sendCommunicationCampaign,
  sendStaffCommunication,
  type CommunicationOverview,
  type CommunicationProfile,
  type CommunicationTimeline,
  type SegmentDefinitionInput,
} from "@lib/data/staff/communications"

type Props = {
  countryCode: string
  staffEmail: string
  overview: CommunicationOverview
}

type Tab =
  | "overview"
  | "campaigns"
  | "flows"
  | "segments"
  | "templates"
  | "reports"
  | "profiles"
  | "health"
  | "imports"

/** Engineer trigger keys → sentences an operator can read. */
function humanTrigger(flow: {
  trigger_event?: string | null
  key?: string
}): string {
  const map: Record<string, string> = {
    customer_signed_up: "When someone creates an account",
    cart_abandoned: "When a cart is left behind",
    order_completed: "After an order is placed",
    order_delivered: "After an order is delivered",
    back_in_stock: "When a wished-for product is back in stock",
    calendar_anchor: "On a Hebrew-calendar date (e.g. before a holiday)",
    segment_entered: "When a customer enters the segment",
  }
  const key = String(flow.trigger_event || "")
  return map[key] || (key ? `On ${key.replace(/_/g, " ")}` : "Scheduled by segment")
}

function smsSegmentsOf(body: string) {
  const length = body.length
  if (!length) return { chars: 0, parts: 0 }
  return { chars: length, parts: Math.ceil(length / (length <= 160 ? 160 : 153)) }
}

function formatDate(value?: string | null) {
  if (!value) return "Not yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatMoney(value?: number | string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0))
}

function fieldClass() {
  return "min-h-[42px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-maison-neue text-Charcoal outline-none transition focus:border-Gold focus:ring-1 focus:ring-Gold"
}

function labelClass() {
  return "text-xs font-maison-neue-mono uppercase text-Charcoal/55"
}

function statusClass(status?: string | null) {
  const value = String(status || "").toLowerCase()
  if (["sent", "delivered", "active", "subscribed"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (["failed", "bounced", "complained", "unsubscribed"].includes(value)) {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (["draft", "queued"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }
  return "border-gray-200 bg-gray-50 text-Charcoal/65"
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: typeof Mail
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className={labelClass()}>{label}</p>
        <Icon className="h-4 w-4 text-Charcoal/45" aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-gyst font-bold text-Charcoal">
        {value}
      </p>
    </div>
  )
}

function Badge({ children, status }: { children: string; status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-maison-neue-mono uppercase ${statusClass(status || children)}`}
    >
      {children}
    </span>
  )
}

export default function StaffCommunicationsConsole({
  countryCode,
  staffEmail,
  overview,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview")
  const [profiles, setProfiles] = useState<CommunicationProfile[]>([])
  const [selectedTimeline, setSelectedTimeline] =
    useState<CommunicationTimeline | null>(null)
  const [query, setQuery] = useState("")
  const [campaignDraft, setCampaignDraft] = useState({
    name: "",
    subject: "",
    segment_key: "",
    intro: "",
    body: "",
    cta_label: "Shop now",
    cta_url: "/us/store",
    scheduled_at: "",
  })
  const [campaignChannel, setCampaignChannel] = useState<"email" | "sms">("email")
  const [smsBody, setSmsBody] = useState("")
  const [testPhone, setTestPhone] = useState("")
  const [segmentDraft, setSegmentDraft] = useState({
    name: "",
    description: "",
    customer_type: "",
    route_market: "",
    last_order_within_days: "",
    min_total_orders: "",
    min_total_revenue: "",
    engagement_score_gte: "",
    preferred_delivery_zone: "",
    preferred_cuts_any: "",
    preferred_kosher_types_any: "",
    holiday_buyer: false,
    sms_consent: false,
  })
  const [segmentPreview, setSegmentPreview] = useState<{
    count: number
    sms_reachable: number
    sample: Array<{ email: string; first_name?: string; last_name?: string }>
  } | null>(null)
  const [importJson, setImportJson] = useState("")
  const [staffMessage, setStaffMessage] = useState({
    to: "",
    subject: "",
    body: "",
    profile_id: "",
  })
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedProfile = selectedTimeline?.profile || null
  const segmentOptions = useMemo(
    () => overview.segments.filter((segment) => segment.status === "active"),
    [overview.segments]
  )

  function clearFeedback() {
    setStatus(null)
    setError(null)
  }

  function searchProfiles() {
    clearFeedback()
    startTransition(async () => {
      try {
        const result = await searchCommunicationProfiles(query)
        setProfiles(result.profiles)
        if (!result.profiles.length) setStatus("No profiles found.")
      } catch (err) {
        setError("Profile search failed.")
      }
    })
  }

  function openProfile(profile: CommunicationProfile) {
    clearFeedback()
    setStaffMessage((current) => ({
      ...current,
      to: profile.email,
      profile_id: profile.id,
    }))
    startTransition(async () => {
      try {
        setSelectedTimeline(await getCommunicationProfileTimeline(profile.id))
      } catch {
        setError("Could not load the customer timeline.")
      }
    })
  }

  function saveCampaign() {
    clearFeedback()
    startTransition(async () => {
      try {
        if (campaignChannel === "sms") {
          if (!campaignDraft.name || !smsBody.trim()) {
            setError("Give the text blast a name and a message.")
            return
          }
          const result = await createCommunicationCampaign({
            name: campaignDraft.name,
            subject: campaignDraft.name,
            body: "",
            segment_key: campaignDraft.segment_key || undefined,
            scheduled_at: campaignDraft.scheduled_at || undefined,
            channel: "sms",
            sms_body: smsBody.trim(),
          })
          setStatus(
            `Text blast drafted: ${result.campaign.name}. Send a test to your phone, then Send.`
          )
          return
        }
        if (!campaignDraft.name || !campaignDraft.subject || !campaignDraft.body) {
          setError("Campaign name, subject, and body are required.")
          return
        }
        const result = await createCommunicationCampaign({
          ...campaignDraft,
          segment_key: campaignDraft.segment_key || undefined,
        })
        setStatus(`Draft created: ${result.campaign.name}.`)
      } catch {
        setError("Could not create campaign.")
      }
    })
  }

  function sendLatestCampaign(testOnly: boolean) {
    const latest = overview.campaigns[0]
    if (!latest) {
      setError("Create a campaign first.")
      return
    }
    const isSms = (latest.metadata as any)?.channel === "sms"
    if (testOnly && isSms && !testPhone.trim()) {
      setError("Enter your mobile number (SMS tab) for the test text.")
      return
    }
    clearFeedback()
    startTransition(async () => {
      try {
        const result = await sendCommunicationCampaign(
          latest.id,
          testOnly
            ? isSms
              ? { test_phone: testPhone.trim() }
              : { test_email: staffEmail }
            : {}
        )
        if ((result as any).pending_approval) {
          setStatus(
            `This audience is over the approval threshold — an approval card was posted to #decisions. It sends automatically once Avi or Peter approves.`
          )
          return
        }
        setStatus(
          testOnly
            ? `Test sent to ${isSms ? testPhone.trim() : staffEmail}.`
            : `Campaign sent to ${result.sent} people. ${result.skipped} skipped, ${result.failed} failed.`
        )
      } catch {
        setError("Could not send campaign.")
      }
    })
  }

  function sendDirectMessage() {
    clearFeedback()
    startTransition(async () => {
      try {
        if (!staffMessage.to || !staffMessage.subject || !staffMessage.body) {
          setError("Recipient, subject, and body are required.")
          return
        }
        const result = await sendStaffCommunication({
          ...staffMessage,
          stream: "transactional",
          topic: "order_updates",
        })
        setStatus(
          result.skipped
            ? "Message skipped because this customer is suppressed."
            : "Message sent."
        )
      } catch {
        setError("Could not send message.")
      }
    })
  }

  function segmentDefinitionFromDraft(): SegmentDefinitionInput {
    const d = segmentDraft
    const list = (value: string) =>
      value
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
    return {
      ...(d.customer_type ? { customer_type: d.customer_type } : {}),
      ...(d.route_market ? { route_market: d.route_market } : {}),
      ...(d.last_order_within_days
        ? { last_order_within_days: Number(d.last_order_within_days) }
        : {}),
      ...(d.min_total_orders ? { min_total_orders: Number(d.min_total_orders) } : {}),
      ...(d.min_total_revenue
        ? { min_total_revenue: Number(d.min_total_revenue) }
        : {}),
      ...(d.engagement_score_gte
        ? { engagement_score_gte: Number(d.engagement_score_gte) }
        : {}),
      ...(d.preferred_delivery_zone
        ? { preferred_delivery_zone: d.preferred_delivery_zone }
        : {}),
      ...(d.preferred_cuts_any
        ? { preferred_cuts_any: list(d.preferred_cuts_any) }
        : {}),
      ...(d.preferred_kosher_types_any
        ? { preferred_kosher_types_any: list(d.preferred_kosher_types_any) }
        : {}),
      ...(d.holiday_buyer ? { holiday_buyer: true } : {}),
      ...(d.sms_consent ? { sms_consent: true } : {}),
    }
  }

  function previewSegment() {
    clearFeedback()
    startTransition(async () => {
      try {
        setSegmentPreview(
          await previewCommunicationSegment(segmentDefinitionFromDraft())
        )
      } catch {
        setError("Could not preview that audience.")
      }
    })
  }

  function saveSegment() {
    clearFeedback()
    if (!segmentDraft.name.trim()) {
      setError("Give the segment a name.")
      return
    }
    const definition = segmentDefinitionFromDraft()
    if (!Object.keys(definition).length) {
      setError("Pick at least one condition.")
      return
    }
    startTransition(async () => {
      try {
        const result = await createCommunicationSegment({
          name: segmentDraft.name.trim(),
          description: segmentDraft.description.trim() || undefined,
          definition,
        })
        setStatus(
          `Segment "${result.segment?.name || segmentDraft.name}" saved — ${
            result.segment?.cached_count ?? "…"
          } people. It now appears in every campaign audience picker.`
        )
      } catch {
        setError("Could not save the segment.")
      }
    })
  }

  function sendSmsTest(campaignId: string) {
    if (!testPhone.trim()) {
      setError("Enter your mobile number for the test text.")
      return
    }
    clearFeedback()
    startTransition(async () => {
      try {
        const result = await sendCommunicationCampaign(campaignId, {
          test_phone: testPhone.trim(),
        })
        setStatus(
          result.sent >= 1
            ? `Test text sent to ${testPhone.trim()}.`
            : `Test text not sent (${(result as any).error || "suppressed or deferred"}).`
        )
      } catch {
        setError("Could not send the test text.")
      }
    })
  }

  function runFlows() {
    clearFeedback()
    startTransition(async () => {
      try {
        const result = await runCommunicationFlowsNow()
        setStatus(
          `Lifecycle refreshed ${result.lifecycle.updated} profiles. Segments refreshed ${result.flows.segments?.refreshed || 0} audiences. Flow runner processed ${result.flows.processed}, sent ${result.flows.sent}, completed ${result.flows.completed}.`
        )
      } catch {
        setError("Could not run communication flows.")
      }
    })
  }

  function importContacts() {
    clearFeedback()
    startTransition(async () => {
      try {
        const parsed = JSON.parse(importJson || "[]")
        const rows = Array.isArray(parsed) ? parsed : parsed.rows
        if (!Array.isArray(rows) || !rows.length) {
          setError("Paste a JSON array of exported Constant Contact rows.")
          return
        }
        const result = await importConstantContactRows({
          filename: "manual-staff-import.json",
          rows,
        })
        setStatus(
          `Import ${result.import_run_id} finished with ${result.stats.imported || 0} imported, ${result.stats.skipped || 0} skipped, and ${result.stats.failed || 0} failed.`
        )
      } catch {
        setError("Could not parse or import those rows.")
      }
    })
  }

  return (
    <main className="min-h-screen bg-SilverPlate/30 px-4 py-8 text-Charcoal md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-maison-neue-mono uppercase text-Gold">
              Staff console
            </p>
            <h1 className="mt-2 text-3xl font-gyst font-bold text-Charcoal">
              Customer communications
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-maison-neue text-Charcoal/65">
              One place for order notices, lifecycle flows, campaigns,
              customer timelines, suppressions, and Postmark delivery state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LocalizedClientLink
              href="/account/staff/communications/canvas"
              className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal transition hover:bg-Charcoal hover:text-white"
              data-testid="open-campaign-canvas"
            >
              Design an email
            </LocalizedClientLink>
          </div>
        </div>

        {(status || error) && (
          <div
            className={`mb-5 rounded-md border px-4 py-3 text-sm font-maison-neue ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error || status}
          </div>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Profiles" value={overview.metrics.profiles} icon={Users} />
          <Stat label="Consented" value={overview.metrics.consented} icon={ShieldCheck} />
          <Stat label="Sent" value={overview.metrics.messages_sent} icon={Mail} />
          <Stat
            label="Attributed"
            value={formatMoney(overview.metrics.attributed_revenue || 0)}
            icon={BarChart3}
          />
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto">
          {[
            ["overview", "Overview"],
            ["campaigns", "Campaigns"],
            ["flows", "Flows"],
            ["segments", "Segments"],
            ["templates", "Templates"],
            ["reports", "Reports"],
            ["profiles", "Customers"],
            ["health", "Delivery"],
            ["imports", "Imports"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as Tab)}
              className={`min-h-[38px] rounded-md border px-4 text-sm font-maison-neue font-semibold transition ${
                tab === key
                  ? "border-Charcoal bg-Charcoal text-white"
                  : "border-gray-200 bg-white text-Charcoal hover:border-Gold/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="People"
                value={overview.metrics.profiles}
                icon={Users}
              />
              <Stat
                label="Email marketing OK"
                value={overview.metrics.consented}
                icon={Mail}
              />
              <Stat
                label="SMS marketing OK"
                value={overview.metrics.sms_consented || 0}
                icon={Bell}
              />
              <Stat
                label="Est. incremental revenue (90d)"
                value={formatMoney(
                  overview.reports?.incremental
                    ?.total_estimated_incremental_revenue || 0
                )}
                icon={BarChart3}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <p className={labelClass()}>Campaign pipeline</p>
                <h2 className="mt-1 text-xl font-gyst font-bold">
                  What&apos;s in motion
                </h2>
                <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                  {overview.campaigns.length === 0 && (
                    <p className="px-4 py-6 text-sm text-Charcoal/55">
                      No campaigns yet. Start one from the Campaigns tab or
                      design an email in the canvas.
                    </p>
                  )}
                  {overview.campaigns.slice(0, 6).map((campaign) => {
                    const channel =
                      (campaign.metadata as any)?.channel === "sms"
                        ? "SMS"
                        : "Email"
                    const metrics = (campaign.metrics || {}) as any
                    return (
                      <div
                        key={campaign.id}
                        className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1fr)_70px_120px_170px] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-maison-neue font-semibold">
                            {campaign.name}
                          </p>
                          <p className="truncate text-xs text-Charcoal/55">
                            {campaign.status === "sent" && metrics.sent !== undefined
                              ? `${metrics.sent} sent · ${metrics.skipped || 0} skipped`
                              : campaign.subject || campaign.segment_key || ""}
                          </p>
                        </div>
                        <span className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
                          {channel}
                        </span>
                        <Badge status={campaign.status}>{campaign.status}</Badge>
                        <span className="text-xs text-Charcoal/55">
                          {formatDate(campaign.sent_at || campaign.scheduled_at)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <p className={`mt-6 ${labelClass()}`}>Flows working for you</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {overview.flows
                    .filter((flow) => flow.status === "active")
                    .slice(0, 6)
                    .map((flow) => (
                      <button
                        key={flow.id}
                        type="button"
                        onClick={() => setTab("flows")}
                        className="rounded-md border border-gray-100 px-3 py-2 text-left transition hover:border-Gold"
                      >
                        <p className="truncate text-sm font-maison-neue font-semibold">
                          {flow.name}
                        </p>
                        <p className="truncate text-xs text-Charcoal/55">
                          {humanTrigger(flow)}
                        </p>
                      </button>
                    ))}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <p className={labelClass()}>Start something</p>
                <h2 className="mt-1 text-xl font-gyst font-bold">
                  Quick actions
                </h2>
                <div className="mt-4 grid gap-2">
                  <LocalizedClientLink
                    href="/account/staff/communications/canvas"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                  >
                    Design an email
                  </LocalizedClientLink>
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignChannel("sms")
                      setTab("campaigns")
                    }}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                  >
                    Write a text blast
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("segments")}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                  >
                    Build a segment
                  </button>
                </div>

                <p className={`mt-6 ${labelClass()}`}>Sender health</p>
                <div className="mt-2 grid gap-2">
                  {Object.entries(
                    overview.reports?.deliverability?.streams || {}
                  ).map(([stream, health]) => (
                    <div
                      key={stream}
                      className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                    >
                      <span className="text-sm font-maison-neue">{stream}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          health.health === "at_risk"
                            ? "bg-red-50 text-red-700"
                            : health.health === "watch"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {health.health.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTab("health")}
                    className="text-left text-xs text-Charcoal/55 underline underline-offset-4"
                  >
                    Full delivery log →
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === "profiles" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="grid flex-1 gap-1">
                  <span className={labelClass()}>Profile search</span>
                  <input
                    className={fieldClass()}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") searchProfiles()
                    }}
                    placeholder="Email, name, or customer ID"
                  />
                </label>
                <button
                  type="button"
                  onClick={searchProfiles}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Search
                </button>
              </div>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => openProfile(profile)}
                    className="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-SilverPlate/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-maison-neue font-semibold">
                          {[profile.first_name, profile.last_name]
                            .filter(Boolean)
                            .join(" ") || profile.email}
                        </p>
                        <p className="truncate text-sm text-Charcoal/60">
                          {profile.email}
                        </p>
                      </div>
                      <Badge status={profile.lifecycle_stage}>
                        {profile.lifecycle_stage}
                      </Badge>
                    </div>
                    <p className="text-xs text-Charcoal/55">
                      {profile.total_orders || 0} orders,{" "}
                      {formatMoney(profile.total_revenue)}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className={labelClass()}>Customer timeline</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    {selectedProfile?.email || "Select a profile"}
                  </h2>
                </div>
                <Clock3 className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              {selectedTimeline ? (
                <div className="grid gap-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Stat
                      label="Orders"
                      value={selectedTimeline.profile.total_orders || 0}
                      icon={Bell}
                    />
                    <Stat
                      label="Revenue"
                      value={formatMoney(selectedTimeline.profile.total_revenue)}
                      icon={BarChart3}
                    />
                    <Stat
                      label="Consent"
                      value={
                        selectedTimeline.profile.email_consent ? "Yes" : "No"
                      }
                      icon={ShieldCheck}
                    />
                  </div>
                  <div className="divide-y divide-gray-100 rounded-md border border-gray-100">
                    {selectedTimeline.events.slice(0, 25).map((event) => (
                      <div key={event.id} className="px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-maison-neue font-semibold">
                            {event.event_name}
                          </p>
                          <span className="text-xs text-Charcoal/55">
                            {formatDate(event.occurred_at)}
                          </span>
                        </div>
                        {event.template_key && (
                          <p className="mt-1 text-xs text-Charcoal/55">
                            {event.template_key}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-gray-200 bg-SilverPlate/25 p-6 text-sm text-Charcoal/60">
                  Search for a customer to inspect their order, email, segment,
                  and lifecycle history.
                </div>
              )}
            </section>
          <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>Direct customer email</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                Send a staff note
              </h2>
              <div className="mt-5 grid gap-3">
                <label className="grid gap-1">
                  <span className={labelClass()}>To</span>
                  <input
                    className={fieldClass()}
                    value={staffMessage.to}
                    onChange={(event) =>
                      setStaffMessage((current) => ({
                        ...current,
                        to: event.target.value,
                      }))
                    }
                    placeholder="customer@example.com"
                  />
                </label>
                <label className="grid gap-1">
                  <span className={labelClass()}>Subject</span>
                  <input
                    className={fieldClass()}
                    value={staffMessage.subject}
                    onChange={(event) =>
                      setStaffMessage((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    placeholder="Update on your Griller's Pride order"
                  />
                </label>
                <label className="grid gap-1">
                  <span className={labelClass()}>Body</span>
                  <textarea
                    className={`${fieldClass()} min-h-[150px]`}
                    value={staffMessage.body}
                    onChange={(event) =>
                      setStaffMessage((current) => ({
                        ...current,
                        body: event.target.value,
                      }))
                    }
                    placeholder="Write a concise customer-safe note."
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={sendDirectMessage}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Send
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "campaigns" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>Campaign drafts</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                Recent campaigns
              </h2>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {overview.campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-maison-neue font-semibold">
                        {campaign.name}
                      </p>
                      <p className="truncate text-sm text-Charcoal/60">
                        {campaign.subject}
                      </p>
                    </div>
                    <Badge status={campaign.status}>{campaign.status}</Badge>
                    <span className="text-xs text-Charcoal/55">
                      {formatDate(campaign.sent_at || campaign.scheduled_at)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => sendLatestCampaign(true)}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal"
                >
                  Send test
                </button>
                <button
                  type="button"
                  onClick={() => sendLatestCampaign(false)}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white"
                >
                  Send latest
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>New campaign</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                {campaignChannel === "sms" ? "Text blast" : "Email blast"}
              </h2>
              <div className="mt-3 inline-flex rounded-md border border-gray-200 p-1">
                {(["email", "sms"] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setCampaignChannel(channel)}
                    className={`rounded px-4 py-1.5 text-xs font-rexton font-bold uppercase transition ${
                      campaignChannel === channel
                        ? "bg-Charcoal text-white"
                        : "text-Charcoal/60"
                    }`}
                  >
                    {channel === "sms" ? "SMS" : "Email"}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  className={fieldClass()}
                  placeholder="Campaign name"
                  value={campaignDraft.name}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                {campaignChannel === "email" ? (
                <input
                  className={fieldClass()}
                  placeholder="Subject"
                  value={campaignDraft.subject}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                />
                ) : null}
                <select
                  className={fieldClass()}
                  value={campaignDraft.segment_key}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      segment_key: event.target.value,
                    }))
                  }
                >
                  <option value="">All consented profiles</option>
                  {segmentOptions.map((segment) => (
                    <option key={segment.key} value={segment.key}>
                      {segment.name}
                    </option>
                  ))}
                </select>
                {campaignChannel === "email" ? (
                <>
                <input
                  className={fieldClass()}
                  placeholder="Intro line"
                  value={campaignDraft.intro}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      intro: event.target.value,
                    }))
                  }
                />
                <textarea
                  className={`${fieldClass()} min-h-[180px]`}
                  placeholder="Body. Use short paragraphs."
                  value={campaignDraft.body}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
                <input
                  className={fieldClass()}
                  placeholder="CTA label"
                  value={campaignDraft.cta_label}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      cta_label: event.target.value,
                    }))
                  }
                />
                <input
                  className={fieldClass()}
                  placeholder="/us/store"
                  value={campaignDraft.cta_url}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      cta_url: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-Charcoal/55">
                  Tip: for a designed layout, use{" "}
                  <LocalizedClientLink
                    href="/account/staff/communications/canvas"
                    className="underline underline-offset-2"
                  >
                    the canvas
                  </LocalizedClientLink>{" "}
                  instead — it saves a template and creates the campaign for
                  you.
                </p>
                </>
                ) : (
                <>
                <textarea
                  className={`${fieldClass()} min-h-[140px]`}
                  placeholder={"Your text message. {{first_name}} works here.\nExample: Hi {{first_name}} — brisket pre-orders for Rosh Hashanah close Sunday. Order: getgrillerspride.com Reply STOP to opt out."}
                  value={smsBody}
                  onChange={(event) => setSmsBody(event.target.value)}
                />
                <p className="text-xs text-Charcoal/55">
                  {smsSegmentsOf(smsBody).chars} characters ·{" "}
                  {smsSegmentsOf(smsBody).parts || 0} SMS part
                  {smsSegmentsOf(smsBody).parts === 1 ? "" : "s"} per person.
                  Sends only to people who said yes to texts, 9am–8:30pm ET,
                  never on Shabbat or Yom Tov, max 2 marketing texts per week.
                </p>
                <div className="flex gap-2">
                  <input
                    className={`${fieldClass()} flex-1`}
                    placeholder="Your mobile for a test text"
                    value={testPhone}
                    onChange={(event) => setTestPhone(event.target.value)}
                  />
                </div>
                </>
                )}
                <input
                  className={fieldClass()}
                  type="datetime-local"
                  value={campaignDraft.scheduled_at}
                  onChange={(event) =>
                    setCampaignDraft((current) => ({
                      ...current,
                      scheduled_at: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={saveCampaign}
                  disabled={isPending}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white disabled:opacity-50"
                >
                  Save draft
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "flows" && (
          <div className="grid gap-5">
            <section className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={labelClass()}>Automations</p>
                <p className="mt-1 text-sm text-Charcoal/70">
                  Flows run themselves on a schedule. The button forces a pass
                  right now — useful after editing or when testing.
                </p>
              </div>
              <button
                type="button"
                onClick={runFlows}
                disabled={isPending}
                className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal disabled:opacity-50"
              >
                <Play className="h-4 w-4" aria-hidden />
                Run due steps now
              </button>
            </section>
            <div className="grid gap-5 lg:grid-cols-2">
              {overview.flows.map((flow) => {
                const steps = Array.isArray(flow.steps) ? flow.steps : []
                return (
                  <section
                    key={flow.id}
                    className="rounded-lg border border-gray-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-gyst font-bold">
                          {flow.name}
                        </h2>
                        <p className="mt-1 text-sm text-Charcoal/65">
                          {humanTrigger(flow)}
                        </p>
                      </div>
                      <Badge status={flow.status}>{flow.status}</Badge>
                    </div>
                    {flow.description ? (
                      <p className="mt-3 text-sm text-Charcoal/70">
                        {flow.description}
                      </p>
                    ) : null}
                    {steps.length ? (
                      <ol className="mt-4 grid gap-1.5">
                        {steps.slice(0, 5).map((step: any, index: number) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-xs text-Charcoal/65"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-SilverPlate/60 font-semibold">
                              {index + 1}
                            </span>
                            <span className="truncate">
                              {step.type === "wait" || step.delay_hours
                                ? null
                                : null}
                              {step.type === "sms" ? "Text: " : ""}
                              {step.subject ||
                                step.body?.slice(0, 60) ||
                                step.template_key ||
                                step.type}
                              {step.delay_hours
                                ? ` · after ${
                                    step.delay_hours >= 24
                                      ? `${Math.round(step.delay_hours / 24)}d`
                                      : `${step.delay_hours}h`
                                  }`
                                : ""}
                            </span>
                          </li>
                        ))}
                        {steps.length > 5 ? (
                          <li className="text-xs text-Charcoal/45">
                            +{steps.length - 5} more steps
                          </li>
                        ) : null}
                      </ol>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </div>
        )}

        {tab === "segments" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>Audiences</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">Segments</h2>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {overview.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1fr)_110px_90px] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-maison-neue font-semibold">
                        {segment.name}
                      </p>
                      <p className="truncate text-xs text-Charcoal/55">
                        {segment.description || segment.key}
                      </p>
                    </div>
                    <span className="text-sm font-maison-neue font-semibold">
                      {segment.cached_count ?? "…"} people
                    </span>
                    <Badge status={segment.status}>{segment.status}</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-Charcoal/55">
                Counts refresh automatically every maintenance pass and when a
                segment is saved.
              </p>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>New segment</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                Build an audience
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  className={fieldClass()}
                  placeholder="Segment name (e.g. Brisket lovers, Atlanta)"
                  value={segmentDraft.name}
                  onChange={(event) =>
                    setSegmentDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <input
                  className={fieldClass()}
                  placeholder="Description (optional)"
                  value={segmentDraft.description}
                  onChange={(event) =>
                    setSegmentDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className={labelClass()}>Customer type</span>
                    <select
                      className={fieldClass()}
                      value={segmentDraft.customer_type}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          customer_type: event.target.value,
                        }))
                      }
                    >
                      <option value="">Any</option>
                      <option value="b2c">Households (B2C)</option>
                      <option value="b2b">Businesses (B2B)</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className={labelClass()}>Market</span>
                    <select
                      className={fieldClass()}
                      value={segmentDraft.route_market}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          route_market: event.target.value,
                        }))
                      }
                    >
                      <option value="">Anywhere</option>
                      <option value="core_delivery">Atlanta delivery routes</option>
                      <option value="national">National (shipping)</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className={labelClass()}>Ordered within (days)</span>
                    <input
                      className={fieldClass()}
                      type="number"
                      placeholder="e.g. 90"
                      value={segmentDraft.last_order_within_days}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          last_order_within_days: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className={labelClass()}>Min. lifetime orders</span>
                    <input
                      className={fieldClass()}
                      type="number"
                      placeholder="e.g. 3"
                      value={segmentDraft.min_total_orders}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          min_total_orders: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className={labelClass()}>Min. lifetime spend ($)</span>
                    <input
                      className={fieldClass()}
                      type="number"
                      placeholder="e.g. 500"
                      value={segmentDraft.min_total_revenue}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          min_total_revenue: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className={labelClass()}>Favorite cuts (comma-sep)</span>
                    <input
                      className={fieldClass()}
                      placeholder="brisket, short rib"
                      value={segmentDraft.preferred_cuts_any}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          preferred_cuts_any: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-Gold"
                      checked={segmentDraft.holiday_buyer}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          holiday_buyer: event.target.checked,
                        }))
                      }
                    />
                    Holiday buyers
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-Gold"
                      checked={segmentDraft.sms_consent}
                      onChange={(event) =>
                        setSegmentDraft((current) => ({
                          ...current,
                          sms_consent: event.target.checked,
                        }))
                      }
                    />
                    Said yes to texts
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={previewSegment}
                    disabled={isPending}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal disabled:opacity-50"
                  >
                    Preview audience
                  </button>
                  <button
                    type="button"
                    onClick={saveSegment}
                    disabled={isPending}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white disabled:opacity-50"
                  >
                    Save segment
                  </button>
                </div>
                {segmentPreview ? (
                  <div className="rounded-md border border-gray-100 bg-SilverPlate/30 px-4 py-3 text-sm">
                    <p className="font-maison-neue font-semibold">
                      {segmentPreview.count} people match
                      {segmentPreview.sms_reachable
                        ? ` · ${segmentPreview.sms_reachable} reachable by text`
                        : ""}
                    </p>
                    {segmentPreview.sample.length ? (
                      <p className="mt-1 truncate text-xs text-Charcoal/55">
                        e.g.{" "}
                        {segmentPreview.sample
                          .map((row) => row.email)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        )}

        {tab === "reports" && (
          <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>30 day performance</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    Lifecycle and campaign revenue
                  </h2>
                </div>
                <MousePointerClick className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Attributed orders"
                  value={overview.reports?.metrics.attributed_orders || 0}
                  icon={BarChart3}
                />
                <Stat
                  label="Attributed revenue"
                  value={formatMoney(overview.reports?.metrics.attributed_revenue || 0)}
                  icon={BarChart3}
                />
                <Stat
                  label="Abandoned carts"
                  value={overview.reports?.metrics.abandoned_carts || 0}
                  icon={Clock3}
                />
                <Stat
                  label="Recovered carts"
                  value={overview.reports?.metrics.recovered_carts || 0}
                  icon={ShieldCheck}
                />
              </div>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.reports?.attribution.rows || []).map((row, index) => (
                  <div
                    key={`${row.campaign_id || row.flow_key || row.template_key}-${index}`}
                    className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1fr)_110px_130px] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-maison-neue font-semibold">
                        {row.campaign_id || row.flow_key || row.template_key || "Unlabeled"}
                      </p>
                      <p className="truncate text-xs text-Charcoal/55">
                        {row.template_key || "template not set"}
                      </p>
                    </div>
                    <span className="text-sm text-Charcoal/65">
                      {row.orders || 0} orders
                    </span>
                    <span className="text-sm font-maison-neue font-semibold">
                      {formatMoney(row.revenue || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>Event mix</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                Recent signals
              </h2>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.reports?.events_by_name || []).slice(0, 12).map((row) => (
                  <div
                    key={row.event_name}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-maison-neue-mono text-xs">
                      {row.event_name}
                    </span>
                    <span className="font-maison-neue font-semibold">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>Holdout lift · last 90 days</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    Incremental revenue by flow
                  </h2>
                </div>
                <span className="text-right text-sm font-maison-neue font-semibold">
                  {formatMoney(
                    overview.reports?.incremental
                      ?.total_estimated_incremental_revenue || 0
                  )}
                  <span className="block text-[11px] font-normal uppercase tracking-wide text-Charcoal/50">
                    est. incremental (upper bound)
                  </span>
                </span>
              </div>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.reports?.incremental?.flows || []).length === 0 && (
                  <p className="px-4 py-6 text-sm text-Charcoal/55">
                    No flow enrollments in the window yet. Holdout lift appears
                    once flows start enrolling profiles.
                  </p>
                )}
                {(overview.reports?.incremental?.flows || []).map((flow) => (
                  <div key={flow.flow_key} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate font-maison-neue font-semibold">
                        {flow.flow_key}
                      </p>
                      <span className="whitespace-nowrap text-sm font-maison-neue font-semibold">
                        {formatMoney(flow.estimated_incremental_revenue)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-Charcoal/60">
                      <span>
                        treated {(flow.treated_conversion_rate * 100).toFixed(1)}%
                        ({flow.treated.converters}/{flow.treated.enrolled})
                      </span>
                      <span>
                        holdout {(flow.holdout_conversion_rate * 100).toFixed(1)}%
                        ({flow.holdout.converters}/{flow.holdout.enrolled})
                      </span>
                      <span>
                        lift {(flow.conversion_lift * 100).toFixed(1)}pt ·{" "}
                        {formatMoney(flow.incremental_revenue_per_enrolled)}/enrolled
                      </span>
                      {flow.no_holdout ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-Charcoal/60">
                          no holdout — not measurable
                        </span>
                      ) : flow.low_confidence ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                          low confidence
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>Deliverability · last 30 days</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                Sender health by stream
              </h2>
              <div className="mt-5 space-y-3">
                {Object.entries(overview.reports?.deliverability?.streams || {})
                  .length === 0 && (
                  <p className="rounded-md border border-gray-100 px-4 py-6 text-sm text-Charcoal/55">
                    No email volume in the window yet.
                  </p>
                )}
                {Object.entries(
                  overview.reports?.deliverability?.streams || {}
                ).map(([stream, s]) => (
                  <div
                    key={stream}
                    className="rounded-md border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-maison-neue font-semibold">{stream}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          s.health === "at_risk"
                            ? "bg-red-50 text-red-700"
                            : s.health === "watch"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {s.health.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-Charcoal/60">
                      <span>{s.total} sent</span>
                      <span>{(s.delivery_rate * 100).toFixed(1)}% delivered</span>
                      <span>{(s.bounce_rate * 100).toFixed(2)}% bounced</span>
                      <span>
                        {(s.complaint_rate * 100).toFixed(3)}% complaints
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-Charcoal/55">
                  {(overview.reports?.deliverability?.suppressions || []).map(
                    (row) => (
                      <span key={row.reason}>
                        {row.reason}: {row.count}
                      </span>
                    )
                  )}
                  {Object.entries(
                    overview.reports?.deliverability?.sms_by_status || {}
                  ).map(([status, count]) => (
                    <span key={`sms-${status}`}>
                      sms {status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>
          </>
        )}

        {tab === "templates" && (() => {
          const templates = overview.templates || []
          const marketing = templates.filter(
            (t) => t.message_stream !== "transactional"
          )
          const transactional = templates.filter(
            (t) => t.message_stream === "transactional"
          )
          const card = (template: (typeof templates)[number], editable: boolean) => (
            <section
              key={template.id}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={labelClass()}>
                    {template.message_stream} /{" "}
                    {template.message_purpose || "purpose"}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-gyst font-bold">
                    {template.name}
                  </h2>
                </div>
                <Badge status={template.status}>{template.status}</Badge>
              </div>
              <p className="mt-3 text-sm font-maison-neue text-Charcoal/70">
                {template.subject}
              </p>
              {editable ? (
                <LocalizedClientLink
                  href={`/account/staff/communications/canvas?key=${encodeURIComponent(template.key)}`}
                  className="mt-3 inline-flex items-center text-sm font-semibold underline underline-offset-4"
                >
                  Edit in canvas →
                </LocalizedClientLink>
              ) : (
                <p className="mt-3 text-xs text-Charcoal/50">
                  Sent automatically with order data (v{template.version}).
                </p>
              )}
            </section>
          )
          return (
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-gyst font-bold">
                  Marketing templates
                </h2>
                <p className="mt-1 text-sm text-Charcoal/60">
                  Designed emails for campaigns and flows. Edit any of them in
                  the canvas — saving bumps the version and future sends pick
                  it up immediately.
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {marketing.map((t) => card(t, true))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-gyst font-bold">
                  Transactional emails
                </h2>
                <p className="mt-1 text-sm text-Charcoal/60">
                  Order confirmations, shipping updates, password resets. These
                  render from code with live order data, so copy changes are a
                  quick engineering request — tell Avi what you want changed.
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {transactional.map((t) => card(t, false))}
                </div>
              </div>
            </div>
          )
        })()}

        {tab === "health" && (
          <div className="grid gap-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>Recent email</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    Send log
                  </h2>
                </div>
                <BarChart3 className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              <div className="overflow-hidden rounded-md border border-gray-100">
                <div className="hidden grid-cols-[minmax(0,1fr)_170px_120px_150px] border-b border-gray-100 bg-SilverPlate/40 px-4 py-3 text-xs font-maison-neue-mono uppercase text-Charcoal/45 md:grid">
                  <span>Message</span>
                  <span>Stream / purpose</span>
                  <span>Status</span>
                  <span>Sent</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {overview.recent_messages.map((message) => (
                    <div
                      key={message.id}
                      className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[minmax(0,1fr)_170px_120px_150px] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-maison-neue font-semibold">
                          {message.subject || message.template_key || "Email"}
                        </p>
                        <p className="truncate text-xs text-Charcoal/55">
                          {message.email}
                        </p>
                      </div>
                      <div className="text-xs font-maison-neue-mono uppercase text-Charcoal/55">
                        <p>{message.message_stream || "email"}</p>
                        <p className="text-Charcoal/35">
                          {message.message_purpose || "purpose"}
                        </p>
                      </div>
                      <Badge status={message.status}>{message.status}</Badge>
                      <span className="text-xs text-Charcoal/55">
                        {formatDate(message.sent_at || message.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>Postmark</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    Monthly volume
                  </h2>
                </div>
                <Mail className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              <p className="mt-4 text-sm text-Charcoal/65">
                {overview.postmark_usage
                  ? `${overview.postmark_usage.sent_or_queued_this_month} of ${overview.postmark_usage.configured_monthly_limit} configured monthly messages used.`
                  : "Postmark usage is not available yet."}
              </p>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.postmark_usage?.by_purpose || []).map((row) => (
                  <div
                    key={row.message_purpose || "unknown"}
                    className="grid grid-cols-[minmax(0,1fr)_80px] items-center gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-maison-neue-mono text-xs uppercase text-Charcoal/55">
                      {row.message_purpose || "unknown"}
                    </span>
                    <span className="text-right font-maison-neue font-semibold">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>BullMQ</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    Queue health
                  </h2>
                </div>
                <Database className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              <p className="mt-4 text-sm text-Charcoal/65">
                {overview.queue?.configured
                  ? "Redis queues are configured."
                  : "Redis queues are not configured. Scheduled jobs run the fallback path."}
              </p>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.queue?.queues || []).map((queue) => (
                  <div key={queue.name} className="px-4 py-3 text-sm">
                    <p className="font-maison-neue font-semibold">{queue.name}</p>
                    <p className="mt-1 text-xs text-Charcoal/55">
                      Waiting {queue.counts.waiting || 0}, delayed{" "}
                      {queue.counts.delayed || 0}, active {queue.counts.active || 0},
                      failed {queue.counts.failed || 0}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>Delivery destinations</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    ClickHouse and GA4 delivery
                  </h2>
                </div>
                <AlertTriangle className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.reports?.delivery_by_target || []).map((row) => (
                  <div
                    key={`${row.target}-${row.status}`}
                    className="grid grid-cols-[minmax(0,1fr)_120px_80px] items-center gap-3 px-4 py-3 text-sm"
                  >
                    <span className="truncate font-maison-neue-mono text-xs">
                      {row.target}
                    </span>
                    <Badge status={row.status}>{row.status}</Badge>
                    <span className="text-right font-maison-neue font-semibold">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        )}

                {tab === "imports" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass()}>Constant Contact</p>
                  <h2 className="mt-1 text-xl font-gyst font-bold">
                    Migration imports
                  </h2>
                </div>
                <FileText className="h-5 w-5 text-Charcoal/45" aria-hidden />
              </div>
              <div className="mt-5 divide-y divide-gray-100 rounded-md border border-gray-100">
                {(overview.reports?.import_runs || []).map((run) => (
                  <div
                    key={run.id}
                    className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1fr)_140px_150px] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-maison-neue font-semibold">
                        {run.source}
                      </p>
                      <p className="truncate text-xs text-Charcoal/55">
                        {run.id}
                      </p>
                    </div>
                    <Badge status={run.status}>{run.status}</Badge>
                    <span className="text-xs text-Charcoal/55">
                      {formatDate(run.completed_at || run.started_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <p className={labelClass()}>Manual import</p>
              <h2 className="mt-1 text-xl font-gyst font-bold">
                Paste JSON rows
              </h2>
              <textarea
                className={`${fieldClass()} mt-5 min-h-[260px] font-maison-neue-mono text-xs`}
                value={importJson}
                onChange={(event) => setImportJson(event.target.value)}
                placeholder='[{"Email Address":"customer@example.com","First Name":"Avi","Email Status":"Subscribed"}]'
              />
              <button
                type="button"
                disabled={isPending}
                onClick={importContacts}
                className="mt-3 inline-flex min-h-[42px] items-center justify-center rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white disabled:opacity-50"
              >
                Import rows
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

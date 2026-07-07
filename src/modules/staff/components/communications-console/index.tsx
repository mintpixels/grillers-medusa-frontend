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
  getCommunicationProfileTimeline,
  importConstantContactRows,
  runCommunicationFlowsNow,
  searchCommunicationProfiles,
  sendCommunicationCampaign,
  sendStaffCommunication,
  type CommunicationOverview,
  type CommunicationProfile,
  type CommunicationTimeline,
} from "@lib/data/staff/communications"

type Props = {
  countryCode: string
  staffEmail: string
  overview: CommunicationOverview
}

type Tab =
  | "overview"
  | "profiles"
  | "campaigns"
  | "flows"
  | "reports"
  | "templates"
  | "health"
  | "imports"

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
    clearFeedback()
    startTransition(async () => {
      try {
        const result = await sendCommunicationCampaign(
          latest.id,
          testOnly ? { test_email: staffEmail } : {}
        )
        setStatus(
          testOnly
            ? `Test sent to ${staffEmail}.`
            : `Campaign sent to ${result.sent} profiles. ${result.skipped} skipped, ${result.failed} failed.`
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
              Campaign Canvas
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/account/staff/orders"
              className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-Charcoal px-4 text-sm font-rexton font-bold uppercase text-Charcoal transition hover:bg-Charcoal hover:text-white"
            >
              Orders
            </LocalizedClientLink>
            <button
              type="button"
              onClick={runFlows}
              disabled={isPending}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden />
              Run flows
            </button>
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
            ["profiles", "Profiles"],
            ["campaigns", "Campaigns"],
            ["flows", "Flows"],
            ["reports", "Reports"],
            ["templates", "Templates"],
            ["health", "Health"],
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
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
              <h2 className="mt-1 text-xl font-gyst font-bold">Draft</h2>
              <div className="mt-5 grid gap-3">
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
          <div className="grid gap-5 lg:grid-cols-2">
            {overview.flows.map((flow) => (
              <section
                key={flow.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={labelClass()}>
                      {flow.message_stream} / {flow.message_purpose || "purpose"}
                    </p>
                    <h2 className="mt-1 text-xl font-gyst font-bold">
                      {flow.name}
                    </h2>
                  </div>
                  <Badge status={flow.status}>{flow.status}</Badge>
                </div>
                <p className="mt-4 text-sm text-Charcoal/65">
                  Trigger:{" "}
                  <span className="font-maison-neue-mono">
                    {flow.trigger_event || "segment/schedule"}
                  </span>
                </p>
              </section>
            ))}
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

        {tab === "templates" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {(overview.templates || []).map((template) => (
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
                <p className="mt-3 break-all text-xs font-maison-neue-mono text-Charcoal/50">
                  {template.key}
                  {typeof template.consent_required === "boolean"
                    ? ` | consent ${template.consent_required ? "required" : "not required"}`
                    : ""}
                </p>
              </section>
            ))}
          </div>
        )}

        {tab === "health" && (
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

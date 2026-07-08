"use server"

import "server-only"

import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import { emitStorefrontOpsAlert, type OpsAlertSeverity } from "@lib/ops-alert"
import { canUseOfficeConsole } from "@lib/util/staff-access"
import { adminFetch } from "./admin"

// Customer communications (timelines, campaigns, direct sends, imports, flow
// runs) are an office-console capability. Gate every server action so narrow
// roles (picker, packer, merchandising reviewer) and non-staff sessions cannot
// reach these admin endpoints directly.
async function requireCommunicationsStaff() {
  const staff = await retrieveAuthenticatedCustomerForStaffAccess()
  if (!staff || !canUseOfficeConsole(staff)) {
    throw new Error("Office console access required.")
  }
  return staff
}

function communicationsErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function textLengthBucket(value?: string | null, bucketSize = 100) {
  const length = String(value || "").trim().length
  if (!length) return 0
  return Math.min(5000, Math.ceil(length / bucketSize) * bucketSize)
}

function communicationProfileQueryKind(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return "empty"
  if (trimmed.includes("@")) return "email"
  if (trimmed.replace(/\D/g, "").length >= 7) return "phone"
  return "text"
}

async function emitCommunicationsFailureAlert(input: {
  alertKind: string
  title: string
  action: string
  fingerprint: string
  error: unknown
  severity?: OpsAlertSeverity
  meta?: Record<string, unknown>
}) {
  await emitStorefrontOpsAlert({
    alertKind: input.alertKind,
    severity: input.severity || "warn",
    title: input.title,
    path: "src/lib/data/staff/communications.ts",
    source: "medusa-server",
    fingerprint: input.fingerprint,
    meta: {
      staff_module: "communications",
      action: input.action,
      ...(input.meta || {}),
      error_message: communicationsErrorMessage(input.error).slice(0, 300),
    },
  })
}

export type CommunicationOverview = {
  metrics: {
    profiles: number
    consented: number
    sms_consented?: number
    messages_sent: number
    messages_delivered: number
    messages_failed: number
    messages_bounced: number
    active_flows: number
    segments: number
    attributed_orders?: number
    attributed_revenue?: number
    abandoned_carts?: number
    recovered_carts?: number
  }
  recent_messages: CommunicationMessage[]
  flows: CommunicationFlow[]
  segments: CommunicationSegment[]
  campaigns: CommunicationCampaign[]
  templates?: CommunicationTemplate[]
  queue?: CommunicationQueueHealth
  reports?: CommunicationReports
  postmark_usage?: {
    month_start: string
    sent_or_queued_this_month: number
    configured_monthly_limit: number
    usage_ratio?: number | null
    warning?: boolean
    by_purpose?: Array<Record<string, any>>
  }
}

export type CommunicationMessage = {
  id: string
  email: string
  subject?: string | null
  template_key?: string | null
  message_stream?: string | null
  message_purpose?: string | null
  status: string
  sent_at?: string | null
  created_at?: string | null
  order_id?: string | null
  campaign_id?: string | null
  flow_key?: string | null
}

export type CommunicationFlow = {
  id: string
  key: string
  name: string
  description?: string | null
  status: string
  message_stream: string
  message_purpose?: string | null
  trigger_event?: string | null
  steps?: Array<Record<string, any>> | null
}

export type CommunicationSegment = {
  id: string
  key: string
  name: string
  description?: string | null
  cached_count?: number
  status: string
}

export type CommunicationCampaign = {
  id: string
  name: string
  status: string
  subject?: string | null
  segment_key?: string | null
  scheduled_at?: string | null
  sent_at?: string | null
  metrics?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export type CommunicationTemplate = {
  id: string
  key: string
  name: string
  subject: string
  message_stream: string
  message_purpose?: string | null
  consent_required?: boolean
  status: string
  version: number
  variables?: string[]
  updated_at?: string | null
}

export type CommunicationQueueHealth = {
  configured: boolean
  queues: Array<{
    name: string
    counts: Record<string, number>
  }>
}

export type CommunicationReports = {
  days: number
  metrics: {
    sent_or_queued: number
    sent: number
    delivered: number
    bounced: number
    complained: number
    abandoned_carts: number
    recovered_carts: number
    attributed_orders: number
    attributed_revenue: number
  }
  events_by_name: Array<Record<string, any>>
  messages_by_status: Array<Record<string, any>>
  messages_by_stream: Array<Record<string, any>>
  messages_by_purpose?: Array<Record<string, any>>
  carts_by_status: Array<Record<string, any>>
  delivery_by_target: Array<Record<string, any>>
  attribution: {
    total: { orders: number; revenue: number }
    rows: Array<Record<string, any>>
  }
  incremental?: {
    days: number
    conversion_window_days: number
    flows: Array<{
      flow_key: string
      treated: { enrolled: number; converters: number; orders: number; revenue: number }
      holdout: { enrolled: number; converters: number; orders: number; revenue: number }
      treated_conversion_rate: number
      holdout_conversion_rate: number
      conversion_lift: number
      treated_revenue_per_enrolled: number
      holdout_revenue_per_enrolled: number
      incremental_revenue_per_enrolled: number
      estimated_incremental_revenue: number
      no_holdout?: boolean
      low_confidence: boolean
    }>
    total_estimated_incremental_revenue: number
    total_is_upper_bound?: boolean
  } | null
  deliverability?: {
    days: number
    streams: Record<
      string,
      {
        sent: number
        delivered: number
        bounced: number
        complained: number
        failed: number
        total: number
        bounce_rate: number
        complaint_rate: number
        delivery_rate: number
        health: "healthy" | "watch" | "at_risk"
      }
    >
    day_series: Array<{ day: string; stream: string; status: string; count: number }>
    suppressions: Array<{ reason: string; count: number }>
    sms_by_status: Record<string, number>
  } | null
  import_runs: Array<Record<string, any>>
}

export type CommunicationProfile = {
  id: string
  medusa_customer_id?: string | null
  email: string
  first_name?: string | null
  last_name?: string | null
  customer_type: string
  route_market: string
  lifecycle_stage: string
  total_orders: number
  total_revenue: number
  last_order_at?: string | null
  last_active_at?: string | null
  email_consent: boolean
  preferences?: Record<string, unknown> | null
}

export type CommunicationTimeline = {
  profile: CommunicationProfile
  events: Array<Record<string, any>>
  messages: CommunicationMessage[]
  segments: CommunicationSegment[]
}

export async function getCommunicationOverview() {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<CommunicationOverview>(
      "/admin/grillers/communications"
    )
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_overview_failed",
      title: "Staff communications overview load failed",
      action: "load_overview",
      fingerprint: "staff_communications:overview:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
      },
    })
    throw error
  }
}

export async function searchCommunicationProfiles(query: string) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{ profiles: CommunicationProfile[] }>(
      "/admin/grillers/communications/profiles",
      { query: { q: query, limit: 25 } }
    )
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_profile_search_failed",
      title: "Staff communications profile search failed",
      action: "search_profiles",
      fingerprint: "staff_communications:profile_search:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        query_kind: communicationProfileQueryKind(query),
        query_length_bucket: textLengthBucket(query, 10),
        limit: 25,
      },
    })
    throw error
  }
}

export async function getCommunicationProfileTimeline(profileId: string) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<CommunicationTimeline>(
      `/admin/grillers/communications/profiles/${profileId}`
    )
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_profile_timeline_failed",
      title: "Staff communications profile timeline load failed",
      action: "load_profile_timeline",
      fingerprint: "staff_communications:profile_timeline:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        profile_id: profileId,
      },
    })
    throw error
  }
}

export async function createCommunicationCampaign(input: {
  name: string
  subject: string
  segment_key?: string
  body: string
  cta_label?: string
  cta_url?: string
  intro?: string
  scheduled_at?: string
  /** Canvas-designed gp_email_template key. */
  template_key?: string
  /** "email" (default) or "sms". */
  channel?: string
  /** SMS campaigns: the text body ({{first_name}} supported). */
  sms_body?: string
  /** A/B test: variant-B subject (deterministic 50/50 split). */
  subject_b?: string
  /** Unique per-recipient coupon: {kind, value, expires_days, prefix}. */
  coupon?: { kind: "percent" | "fixed"; value: number; expires_days?: number; prefix?: string }
}) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{ campaign: CommunicationCampaign }>(
      "/admin/grillers/communications/campaigns",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    )
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_campaign_create_failed",
      title: "Staff communications campaign create failed",
      action: "create_campaign",
      fingerprint: "staff_communications:campaign_create:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        segment_key_present: Boolean(input.segment_key),
        scheduled: Boolean(input.scheduled_at),
        cta_url_present: Boolean(input.cta_url),
        body_length_bucket: textLengthBucket(input.body, 500),
      },
    })
    throw error
  }
}

export async function importConstantContactRows(input: {
  filename?: string
  rows: Record<string, unknown>[]
}) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{
      ok: boolean
      import_run_id: string
      status: string
      stats: Record<string, number>
    }>("/admin/grillers/communications/imports", {
      method: "POST",
      body: JSON.stringify(input),
    })
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_import_failed",
      title: "Staff communications import failed",
      action: "import_constant_contact",
      fingerprint: "staff_communications:import:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        filename_present: Boolean(input.filename),
        row_count: input.rows.length,
      },
    })
    throw error
  }
}

export async function sendCommunicationCampaign(
  campaignId: string,
  input: { test_email?: string; test_phone?: string } = {}
) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{
      ok: boolean
      sent: number
      skipped: number
      failed: number
      audience_count: number
    }>(`/admin/grillers/communications/campaigns/${campaignId}/send`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_campaign_send_failed",
      title: "Staff communications campaign send failed",
      action: "send_campaign",
      fingerprint: "staff_communications:campaign_send:failed",
      severity: input.test_email ? "warn" : "page",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        campaign_id: campaignId,
        test_send: Boolean(input.test_email),
      },
    })
    throw error
  }
}

export async function sendStaffCommunication(input: {
  to: string
  subject: string
  heading?: string
  body: string
  stream?: "transactional" | "lifecycle" | "broadcast"
  topic?: string
  order_id?: string
  profile_id?: string
}) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{
      ok: boolean
      skipped?: boolean
      messageId?: string
    }>("/admin/grillers/communications/send", {
      method: "POST",
      body: JSON.stringify(input),
    })
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_direct_send_failed",
      title: "Staff communications direct send failed",
      action: "send_direct_message",
      fingerprint: "staff_communications:direct_send:failed",
      severity: "page",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        stream: input.stream || "transactional",
        topic_present: Boolean(input.topic),
        order_id: input.order_id || "",
        profile_id: input.profile_id || "",
        body_length_bucket: textLengthBucket(input.body, 500),
        recipient_has_at: input.to.includes("@"),
      },
    })
    throw error
  }
}

export async function runCommunicationFlowsNow() {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{
      ok: boolean
      lifecycle: { updated: number }
      flows: {
        processed: number
        sent: number
        completed: number
        errors: number
        segments?: { refreshed: number; active_members: number }
      }
    }>("/admin/grillers/communications/flows/run", {
      method: "POST",
    })
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_flow_run_failed",
      title: "Staff communications flow run failed",
      action: "run_flows",
      fingerprint: "staff_communications:flow_run:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
      },
    })
    throw error
  }
}

export async function saveCommunicationTemplate(input: {
  key: string
  name: string
  subject: string
  preheader?: string | null
  html_body: string
  text_body?: string | null
  mjml_source?: string | null
  canvas_project?: unknown
  message_stream?: string
}) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{
      ok: boolean
      template: { key: string; id: string; version: number }
    }>("/admin/grillers/communications/templates", {
      method: "POST",
      body: JSON.stringify({ ...input, saved_by: staff.email || staff.id }),
    })
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_template_save_failed",
      title: "Staff communications template save failed",
      action: "save_template",
      fingerprint: "staff_communications:template_save:failed",
      error,
      meta: {
        staff_actor_customer_id: staff.id || "",
        key_present: Boolean(input.key),
        html_length_bucket: textLengthBucket(input.html_body, 5000),
      },
    })
    throw error
  }
}

export type SegmentDefinitionInput = {
  customer_type?: string
  route_market?: string
  lifecycle_stage?: string
  email_consent?: boolean
  sms_consent?: boolean
  holiday_buyer?: boolean
  last_order_within_days?: number
  engagement_score_gte?: number
  preferred_delivery_zone?: string
  preferred_cuts_any?: string[]
  preferred_kosher_types_any?: string[]
  min_total_orders?: number
  min_total_revenue?: number
}

export async function createCommunicationSegment(input: {
  key?: string
  name: string
  description?: string
  definition: SegmentDefinitionInput
}) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{ segment: CommunicationSegment }>(
      "/admin/grillers/communications/segments",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    )
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_segment_create_failed",
      title: "Staff communications segment create failed",
      action: "create_segment",
      fingerprint: "staff_communications:create_segment",
      error,
      meta: {
        staff_customer_id: staff.id,
        name_length: textLengthBucket(input.name, 20),
      },
    })
    throw error
  }
}

export async function previewCommunicationSegment(
  definition: SegmentDefinitionInput
) {
  await requireCommunicationsStaff()
  return adminFetch<{
    count: number
    sms_reachable: number
    sample: Array<{ email: string; first_name?: string; last_name?: string }>
  }>("/admin/grillers/communications/segments/preview", {
    method: "POST",
    body: JSON.stringify({ definition }),
  })
}

export async function getCommunicationTemplate(key: string) {
  await requireCommunicationsStaff()
  return adminFetch<{
    template: {
      key: string
      name: string
      subject: string
      html_body?: string | null
      metadata?: { mjml_source?: string | null } | null
    }
  }>(
    `/admin/grillers/communications/templates?key=${encodeURIComponent(key)}`
  )
}

export type FlowStepInput = Record<string, any>

export async function updateCommunicationFlow(
  key: string,
  patch: {
    name?: string
    description?: string
    status?: string
    steps?: FlowStepInput[]
  }
) {
  const staff = await requireCommunicationsStaff()
  try {
    return await adminFetch<{ flow: CommunicationFlow }>(
      `/admin/grillers/communications/flows/${encodeURIComponent(key)}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    )
  } catch (error) {
    await emitCommunicationsFailureAlert({
      alertKind: "staff_communications_flow_update_failed",
      title: "Staff communications flow update failed",
      action: "update_flow",
      fingerprint: "staff_communications:update_flow",
      error,
      meta: { staff_customer_id: staff.id, flow_key: key },
    })
    throw error
  }
}

export async function deleteCommunicationCampaign(campaignId: string) {
  await requireCommunicationsStaff()
  return adminFetch<{ ok: boolean }>(
    `/admin/grillers/communications/campaigns/${encodeURIComponent(campaignId)}`,
    { method: "DELETE" }
  )
}

export async function deleteCommunicationSegment(key: string) {
  await requireCommunicationsStaff()
  return adminFetch<{ ok: boolean }>(
    `/admin/grillers/communications/segments/${encodeURIComponent(key)}`,
    { method: "DELETE" }
  )
}

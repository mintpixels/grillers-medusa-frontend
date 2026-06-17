"use server"

import "server-only"

import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
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

export type CommunicationOverview = {
  metrics: {
    profiles: number
    consented: number
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
  status: string
  message_stream: string
  message_purpose?: string | null
  trigger_event?: string | null
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
  await requireCommunicationsStaff()
  return adminFetch<CommunicationOverview>("/admin/grillers/communications")
}

export async function searchCommunicationProfiles(query: string) {
  await requireCommunicationsStaff()
  return adminFetch<{ profiles: CommunicationProfile[] }>(
    "/admin/grillers/communications/profiles",
    { query: { q: query, limit: 25 } }
  )
}

export async function getCommunicationProfileTimeline(profileId: string) {
  await requireCommunicationsStaff()
  return adminFetch<CommunicationTimeline>(
    `/admin/grillers/communications/profiles/${profileId}`
  )
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
}) {
  await requireCommunicationsStaff()
  return adminFetch<{ campaign: CommunicationCampaign }>(
    "/admin/grillers/communications/campaigns",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )
}

export async function importConstantContactRows(input: {
  filename?: string
  rows: Record<string, unknown>[]
}) {
  await requireCommunicationsStaff()
  return adminFetch<{
    ok: boolean
    import_run_id: string
    status: string
    stats: Record<string, number>
  }>("/admin/grillers/communications/imports", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function sendCommunicationCampaign(
  campaignId: string,
  input: { test_email?: string } = {}
) {
  await requireCommunicationsStaff()
  return adminFetch<{
    ok: boolean
    sent: number
    skipped: number
    failed: number
    audience_count: number
  }>(`/admin/grillers/communications/campaigns/${campaignId}/send`, {
    method: "POST",
    body: JSON.stringify(input),
  })
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
  await requireCommunicationsStaff()
  return adminFetch<{ ok: boolean; skipped?: boolean; messageId?: string }>(
    "/admin/grillers/communications/send",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )
}

export async function runCommunicationFlowsNow() {
  await requireCommunicationsStaff()
  return adminFetch<{
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
}

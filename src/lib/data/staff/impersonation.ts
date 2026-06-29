"use server"

import "server-only"

import { emitStorefrontOpsAlert } from "@lib/ops-alert"
import { retrieveAuthenticatedCustomerForStaffAccess } from "@lib/data/customer"
import {
  canUseOfficeConsole,
  staffDisplayName,
} from "@lib/util/staff-access"
import {
  clearStaffImpersonationCookie,
  readStaffImpersonationCookie,
  writeStaffImpersonationCookie,
} from "./session-cookie"
import type { StaffImpersonationSession } from "./impersonation-types"

type StaffImpersonationAlertStage =
  | "staff_access"
  | "cookie_write"
  | "cookie_clear"

function impersonationErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String((error as any)?.message || error || "staff impersonation failed")

  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(
      /\b(?:cus|customer|cart|order|pm|pi|seti)_[A-Za-z0-9_:-]+/g,
      "[redacted-id]"
    )
    .slice(0, 500)
}

function isExpectedImpersonationDenial(error: unknown) {
  return impersonationErrorMessage(error) === "Office console access required."
}

async function emitStaffImpersonationFailureAlert(input: {
  stage: StaffImpersonationAlertStage
  action: "start" | "stop"
  error: unknown
  staffCustomerId?: string | null
  targetCustomerId?: string | null
}) {
  await emitStorefrontOpsAlert({
    alertKind: "staff_impersonation_failed",
    severity: "warn",
    title: "Staff impersonation failed",
    path: "src/lib/data/staff/impersonation.ts",
    source: "storefront-server",
    fingerprint: `staff_impersonation_failed:${input.action}:${input.stage}`,
    meta: {
      staff_module: "customer_context",
      action: input.action,
      failure_stage: input.stage,
      staff_actor_customer_id: input.staffCustomerId || null,
      target_customer_id: input.targetCustomerId || null,
      has_target_customer_id: Boolean(input.targetCustomerId),
      error_message: impersonationErrorMessage(input.error),
    },
  })
}

async function requireStaffForImpersonation() {
  const staff = await retrieveAuthenticatedCustomerForStaffAccess()
  // Impersonation is an office-console capability. Narrow roles (picker,
  // packer, merchandising reviewer) must never enter a customer's session.
  if (!staff || !canUseOfficeConsole(staff)) {
    throw new Error("Office console access required.")
  }
  return staff
}

export async function getStaffImpersonationSession(): Promise<StaffImpersonationSession | null> {
  const session = await readStaffImpersonationCookie()
  if (!session) return null

  const staff = await retrieveAuthenticatedCustomerForStaffAccess().catch(
    () => null
  )
  if (
    !staff ||
    !canUseOfficeConsole(staff) ||
    staff.id !== session.staffCustomerId
  ) {
    return null
  }

  return session
}

export async function startStaffImpersonation(input: {
  targetCustomerId: string
  targetEmail: string
  targetName: string
}): Promise<{ ok: boolean; session?: StaffImpersonationSession; error?: string }> {
  let stage: StaffImpersonationAlertStage = "staff_access"
  let staffCustomerId: string | null = null

  try {
    stage = "staff_access"
    const staff = await requireStaffForImpersonation()
    staffCustomerId = staff.id
    const session: StaffImpersonationSession = {
      staffCustomerId: staff.id,
      staffEmail: staff.email,
      staffName: staffDisplayName(staff),
      targetCustomerId: input.targetCustomerId,
      targetEmail: input.targetEmail,
      targetName: input.targetName || input.targetEmail,
      startedAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 4,
    }

    stage = "cookie_write"
    await writeStaffImpersonationCookie(session)

    return { ok: true, session }
  } catch (err: any) {
    if (!isExpectedImpersonationDenial(err)) {
      await emitStaffImpersonationFailureAlert({
        action: "start",
        stage,
        error: err,
        staffCustomerId,
        targetCustomerId: input.targetCustomerId,
      }).catch(() => {
        // Fail-open: staff action responses should not depend on alert delivery.
      })
    }

    return { ok: false, error: err?.message || "Could not start impersonation." }
  }
}

export async function stopStaffImpersonation(): Promise<{ ok: boolean }> {
  try {
    await clearStaffImpersonationCookie()
    return { ok: true }
  } catch (err) {
    await emitStaffImpersonationFailureAlert({
      action: "stop",
      stage: "cookie_clear",
      error: err,
    }).catch(() => {
      // Preserve existing behavior: callers should still see the clear failure.
    })
    throw err
  }
}

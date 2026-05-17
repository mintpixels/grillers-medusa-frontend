"use server"

import "server-only"

import { retrieveAuthenticatedCustomer } from "@lib/data/customer"
import { isStaffCustomer, staffDisplayName } from "@lib/util/staff-access"
import {
  clearStaffImpersonationCookie,
  readStaffImpersonationCookie,
  writeStaffImpersonationCookie,
  type StaffImpersonationSession,
} from "./session-cookie"

export type { StaffImpersonationSession } from "./session-cookie"

async function requireStaffForImpersonation() {
  const staff = await retrieveAuthenticatedCustomer()
  if (!staff || !isStaffCustomer(staff)) {
    throw new Error("Staff access required.")
  }
  return staff
}

export async function getStaffImpersonationSession(): Promise<StaffImpersonationSession | null> {
  const session = await readStaffImpersonationCookie()
  if (!session) return null

  const staff = await retrieveAuthenticatedCustomer().catch(() => null)
  if (!staff || !isStaffCustomer(staff) || staff.id !== session.staffCustomerId) {
    return null
  }

  return session
}

export async function startStaffImpersonation(input: {
  targetCustomerId: string
  targetEmail: string
  targetName: string
}): Promise<{ ok: boolean; session?: StaffImpersonationSession; error?: string }> {
  try {
    const staff = await requireStaffForImpersonation()
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

    await writeStaffImpersonationCookie(session)

    return { ok: true, session }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Could not start impersonation." }
  }
}

export async function stopStaffImpersonation(): Promise<{ ok: boolean }> {
  await clearStaffImpersonationCookie()
  return { ok: true }
}

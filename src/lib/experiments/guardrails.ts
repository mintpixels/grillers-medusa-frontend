import type { ExperimentDefinition } from "./types"

export type ExperimentGuardrailResult = {
  allowed: boolean
  reason?: string
}

function envFlag(name: string) {
  return process.env[name]?.toLowerCase() === "true"
}

export function experimentKillSwitchEnabled() {
  return (
    envFlag("EXPERIMENTS_KILL_SWITCH") ||
    envFlag("NEXT_PUBLIC_EXPERIMENTS_KILL_SWITCH")
  )
}

export function evaluateExperimentGuardrails(
  definition: Pick<ExperimentDefinition, "impact">
): ExperimentGuardrailResult {
  if (experimentKillSwitchEnabled()) {
    return {
      allowed: false,
      reason: "Global experiment kill switch is enabled.",
    }
  }

  if (definition.impact !== "revenue") {
    return { allowed: true }
  }

  if (process.env.NODE_ENV !== "production") {
    return { allowed: true }
  }

  if (envFlag("EXPERIMENTS_ALLOW_REVENUE_EXPERIMENTS")) {
    return { allowed: true }
  }

  if (process.env.EXPERIMENTS_REVENUE_GATE_STATUS === "pass") {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason:
      "Revenue experiments are blocked until required purchase telemetry and parity gates pass.",
  }
}

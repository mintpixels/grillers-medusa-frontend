import "server-only"

import { cookies, headers } from "next/headers"

import {
  EXPERIMENT_ASSIGNMENTS_COOKIE,
  EXPERIMENT_ID_COOKIE,
  parseStoredAssignments,
} from "./cookies"
import { evaluateExperimentGuardrails } from "./guardrails"
import { getExperimentDefinition, isKnownVariant } from "./registry"
import { getStatsigVariant } from "./statsig-server"
import type {
  ExperimentAssignment,
  ExperimentAssignmentSource,
  ExperimentDefinition,
  ExperimentRequestContext,
} from "./types"

function fallbackStableId(experimentKey: string) {
  return `fallback:${experimentKey}`
}

function assignmentId(experimentKey: string, variantKey: string, stableId: string) {
  return `${experimentKey}:${variantKey}:${stableId}`
}

function forceEnvKey(experimentKey: string) {
  return `EXPERIMENT_FORCE_${experimentKey
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")}`
}

function assignment(
  definition: ExperimentDefinition,
  variantKey: string,
  stableId: string,
  context: ExperimentRequestContext,
  source: ExperimentAssignmentSource,
  overrides?: Partial<ExperimentAssignment>
): ExperimentAssignment {
  return {
    experimentKey: definition.key,
    variantKey,
    assignmentId: assignmentId(definition.key, variantKey, stableId),
    surface: definition.surface,
    impact: definition.impact,
    source,
    isEnabled: definition.status === "active" && !overrides?.isBlocked,
    isBlocked: false,
    statsigExperiment: definition.statsigExperiment,
    routeMarket: context.routeMarket,
    customerType: context.customerType,
    ...overrides,
  }
}

export async function getExperimentAssignment(
  experimentKey: string,
  context: ExperimentRequestContext = {}
): Promise<ExperimentAssignment | null> {
  const definition = getExperimentDefinition(experimentKey)
  if (!definition) return null

  const requestContext: ExperimentRequestContext = {
    routeMarket: context.routeMarket || "unknown",
    customerType: context.customerType || "unknown",
    userId: context.userId,
    path: context.path,
  }

  const guardrail = evaluateExperimentGuardrails(definition)
  if (!guardrail.allowed) {
    return assignment(
      definition,
      definition.defaultVariant,
      fallbackStableId(experimentKey),
      requestContext,
      guardrail.reason?.includes("kill switch") ? "kill-switch" : "guardrail",
      {
        isEnabled: false,
        isBlocked: true,
        blockReason: guardrail.reason,
      }
    )
  }

  const forcedVariant = process.env[forceEnvKey(experimentKey)]

  if (isKnownVariant(definition, forcedVariant)) {
    const cookieStore = await cookies()
    const stableId =
      cookieStore.get(EXPERIMENT_ID_COOKIE)?.value ||
      cookieStore.get("_gp_anon_id")?.value ||
      fallbackStableId(experimentKey)

    return assignment(
      definition,
      forcedVariant!,
      stableId,
      requestContext,
      "env-override",
      { isEnabled: true }
    )
  }

  if (definition.status !== "active") {
    return assignment(
      definition,
      definition.defaultVariant,
      fallbackStableId(experimentKey),
      requestContext,
      "registry-default",
      { isEnabled: false }
    )
  }

  const cookieStore = await cookies()
  const headerStore = await headers()
  const stableId =
    cookieStore.get(EXPERIMENT_ID_COOKIE)?.value ||
    cookieStore.get("_gp_anon_id")?.value ||
    fallbackStableId(experimentKey)
  requestContext.path =
    requestContext.path || headerStore.get("x-pathname") || undefined

  const stored = parseStoredAssignments(
    cookieStore.get(EXPERIMENT_ASSIGNMENTS_COOKIE)?.value
  )[experimentKey]

  if (stored && isKnownVariant(definition, stored.variantKey)) {
    return {
      ...assignment(
        definition,
        stored.variantKey,
        stableId,
        requestContext,
        "sticky-cookie"
      ),
      assignmentId: stored.assignmentId,
    }
  }

  const statsigVariant = await getStatsigVariant(definition, stableId, requestContext)
  if (isKnownVariant(definition, statsigVariant)) {
    return assignment(
      definition,
      statsigVariant!,
      stableId,
      requestContext,
      "statsig"
    )
  }

  return assignment(
    definition,
    definition.defaultVariant,
    stableId,
    requestContext,
    "registry-default"
  )
}

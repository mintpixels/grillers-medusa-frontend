export const NEXT_PRODUCTION_BUILD_PHASE = "phase-production-build"

export function isProductionBuildPhase(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.NEXT_PHASE === NEXT_PRODUCTION_BUILD_PHASE
}

export function resolveCmsExecutionPolicy({
  runtimeTimeoutMs,
  buildTimeoutMs,
  env = process.env,
}: {
  runtimeTimeoutMs: number
  buildTimeoutMs: number
  env?: Record<string, string | undefined>
}) {
  const isBuildPhase = isProductionBuildPhase(env)

  return {
    isBuildPhase,
    // Build/SSG runs many routes against a cold CMS at once and can wait longer
    // without degrading a shopper request. Both values remain bounded.
    timeoutMs: isBuildPhase ? buildTimeoutMs : runtimeTimeoutMs,
    // Build logs are the right telemetry for an artifact-generation attempt.
    // Runtime ops alerts are reserved for customer-serving executions.
    emitOpsAlerts: !isBuildPhase,
  }
}

export function shouldEmitRuntimeOpsAlerts(
  env: Record<string, string | undefined> = process.env
) {
  return !isProductionBuildPhase(env)
}

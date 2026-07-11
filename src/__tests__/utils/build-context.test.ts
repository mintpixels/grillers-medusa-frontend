import {
  isProductionBuildPhase,
  resolveCmsExecutionPolicy,
  shouldEmitRuntimeOpsAlerts,
} from "@lib/util/build-context"

describe("build execution context", () => {
  it("gives production builds a longer bounded CMS timeout without runtime alerts", () => {
    expect(
      resolveCmsExecutionPolicy({
        runtimeTimeoutMs: 5000,
        buildTimeoutMs: 18_000,
        env: { NEXT_PHASE: "phase-production-build" },
      })
    ).toEqual({
      isBuildPhase: true,
      timeoutMs: 18_000,
      emitOpsAlerts: false,
    })
  })

  it("preserves the tighter timeout and alerting for customer-serving runtime", () => {
    expect(
      resolveCmsExecutionPolicy({
        runtimeTimeoutMs: 5000,
        buildTimeoutMs: 18_000,
        env: { NEXT_PHASE: "phase-production-server" },
      })
    ).toEqual({
      isBuildPhase: false,
      timeoutMs: 5000,
      emitOpsAlerts: true,
    })
    expect(
      shouldEmitRuntimeOpsAlerts({ NEXT_PHASE: "phase-production-server" })
    ).toBe(true)
    expect(
      isProductionBuildPhase({ NEXT_PHASE: "phase-production-build" })
    ).toBe(true)
  })
})

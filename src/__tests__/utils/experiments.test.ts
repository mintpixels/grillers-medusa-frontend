import {
  parseStoredAssignments,
  serializeStoredAssignments,
  updateStoredAssignment,
} from "@lib/experiments/cookies"
import { evaluateExperimentGuardrails } from "@lib/experiments/guardrails"
import { getExperimentDefinition, isKnownVariant } from "@lib/experiments/registry"

describe("experiments", () => {
  const originalEnv = process.env
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    })
  })

  afterAll(() => {
    process.env = originalEnv
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    })
  })

  it("parses only valid sticky assignments", () => {
    const parsed = parseStoredAssignments(
      JSON.stringify({
        homepage_shopping_flow_v1: {
          variantKey: "control",
          assignmentId: "a1",
          assignedAt: "2026-05-01T00:00:00.000Z",
          surface: "homepage",
          impact: "revenue",
          routeMarket: "us",
          customerType: "guest",
          source: "sticky-cookie",
        },
        invalid: {
          variantKey: "control",
        },
      })
    )

    expect(parsed).toEqual({
      homepage_shopping_flow_v1: {
        variantKey: "control",
        assignmentId: "a1",
        assignedAt: "2026-05-01T00:00:00.000Z",
        surface: "homepage",
        impact: "revenue",
        routeMarket: "us",
        customerType: "guest",
        source: "sticky-cookie",
      },
    })
    expect(parseStoredAssignments("not-json")).toEqual({})
  })

  it("serializes updated sticky assignments", () => {
    const updated = updateStoredAssignment({}, "pdp_at_a_glance_v1", {
      variantKey: "collapsed_details",
      assignmentId: "a2",
    })

    const roundTrip = parseStoredAssignments(serializeStoredAssignments(updated))
    expect(roundTrip.pdp_at_a_glance_v1.variantKey).toBe("collapsed_details")
    expect(roundTrip.pdp_at_a_glance_v1.assignmentId).toBe("a2")
  })

  it("blocks revenue experiments in production unless revenue gates pass", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    })

    expect(evaluateExperimentGuardrails({ impact: "revenue" })).toEqual({
      allowed: false,
      reason:
        "Revenue experiments are blocked until required purchase telemetry and parity gates pass.",
    })

    process.env.EXPERIMENTS_REVENUE_GATE_STATUS = "pass"
    expect(evaluateExperimentGuardrails({ impact: "revenue" })).toEqual({
      allowed: true,
    })
  })

  it("allows non-revenue experiments unless the kill switch is enabled", () => {
    expect(evaluateExperimentGuardrails({ impact: "non_revenue" })).toEqual({
      allowed: true,
    })

    process.env.EXPERIMENTS_KILL_SWITCH = "true"
    expect(evaluateExperimentGuardrails({ impact: "non_revenue" })).toEqual({
      allowed: false,
      reason: "Global experiment kill switch is enabled.",
    })
  })

  it("keeps registry variants explicit", () => {
    const definition = getExperimentDefinition("homepage_shopping_flow_v1")

    expect(definition?.defaultVariant).toBe("control")
    expect(definition && isKnownVariant(definition, "products_earlier")).toBe(true)
    expect(definition && isKnownVariant(definition, "unknown")).toBe(false)
  })
})

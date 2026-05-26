"use client"

import { useEffect } from "react"

import {
  getActiveExperimentContext,
  rememberExperimentAssignment,
} from "./client-context"
import type { ExperimentAssignment } from "./types"
import { jitsuTrack, setJitsuExperimentContext } from "@lib/jitsu"

type Props = {
  assignment: ExperimentAssignment | null
}

export default function ExperimentExposure({ assignment }: Props) {
  useEffect(() => {
    if (!assignment) return

    if (!assignment.isEnabled || assignment.isBlocked) {
      return
    }

    rememberExperimentAssignment(assignment)
    setJitsuExperimentContext(getActiveExperimentContext())

    jitsuTrack("experiment_exposed", {
      experiment_key: assignment.experimentKey,
      variant_key: assignment.variantKey,
      assignment_id: assignment.assignmentId,
      route_market: assignment.routeMarket || "unknown",
      customer_type: assignment.customerType || "unknown",
      page_path:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      timestamp: new Date().toISOString(),
    })
  }, [assignment])

  return null
}

type AnyRecord = Record<string, any>

function numericOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null

  if (value && typeof value === "object" && "value" in value) {
    return numericOrNull((value as { value: unknown }).value)
  }

  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

function numeric(value: unknown): number {
  return numericOrNull(value) ?? 0
}

function lineQuantity(line: AnyRecord | undefined, item: AnyRecord): number {
  for (const value of [
    line?.actual_quantity,
    line?.ordered_quantity,
    item.detail?.quantity,
    item.quantity,
  ]) {
    const amount = numericOrNull(value)
    if (amount !== null) return amount
  }

  return 0
}

export function catchWeightReadyForFulfillment(
  detail: AnyRecord | null | undefined
) {
  if (!detail) return false

  const status = detail.finalization?.status
  const metadata = detail.order?.metadata || {}

  return (
    status === "charged_ready_to_ship" ||
    status === "released_to_fulfillment" ||
    metadata.final_charge_status === "succeeded" ||
    metadata.fulfillment_gate_status === "released"
  )
}

export function activeFulfillments(order: AnyRecord | null | undefined) {
  const fulfillments = Array.isArray(order?.fulfillments)
    ? order.fulfillments
    : []
  return fulfillments.filter(
    (fulfillment: AnyRecord) => !fulfillment.canceled_at
  )
}

export function hasActiveFulfillment(order: AnyRecord | null | undefined) {
  return activeFulfillments(order).length > 0
}

export function buildCatchWeightFulfillmentItems(
  order: AnyRecord,
  lines: AnyRecord[] | null | undefined
) {
  const lineByItemId = new Map(
    (Array.isArray(lines) ? lines : []).map((line) => [line.line_item_id, line])
  )

  return (Array.isArray(order?.items) ? order.items : [])
    .map((item: AnyRecord) => {
      const line = lineByItemId.get(item.id)
      if (line?.status === "removed") return null

      const originalQuantity =
        numeric(item.detail?.quantity) || numeric(item.quantity)
      const requestedQuantity = lineQuantity(line, item)
      const quantity =
        originalQuantity > 0
          ? Math.min(requestedQuantity, originalQuantity)
          : requestedQuantity

      if (!item.id || quantity <= 0) return null
      return { id: item.id, quantity }
    })
    .filter(Boolean) as Array<{ id: string; quantity: number }>
}

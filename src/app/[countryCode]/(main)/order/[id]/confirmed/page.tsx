import { retrieveOrder } from "@lib/data/orders"
import strapiClient from "@lib/strapi"
import {
  FulfillmentConfigQuery,
  type FulfillmentConfigData,
} from "@lib/data/strapi/checkout"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

async function getPlantPickupNote(): Promise<string> {
  try {
    const data = await strapiClient.request<FulfillmentConfigData>(FulfillmentConfigQuery)
    return data?.checkout?.PlantPickupPostOrderNote || ""
  } catch {
    return ""
  }
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const [order, plantPickupNote] = await Promise.all([
    retrieveOrder(params.id).catch(() => null),
    getPlantPickupNote(),
  ])

  if (!order) {
    return notFound()
  }

  return <OrderCompletedTemplate order={order} plantPickupNote={plantPickupNote} />
}

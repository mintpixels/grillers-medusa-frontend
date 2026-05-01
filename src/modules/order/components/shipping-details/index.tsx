import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import { formatCityStateZip, formatCountry } from "@lib/util/format-address"
import { formatPhone, stripPhone } from "@lib/util/format-phone"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Delivery
      </Heading>
      <div className="flex items-start gap-x-8">
        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">
            Shipping Address
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          {order.shipping_address?.company && (
            <Text className="txt-medium text-ui-fg-subtle">
              {order.shipping_address.company}
            </Text>
          )}
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.address_1}
            {order.shipping_address?.address_2
              ? `, ${order.shipping_address.address_2}`
              : ""}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address && formatCityStateZip(order.shipping_address as any)}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {formatCountry(order.shipping_address?.country_code)}
          </Text>
        </div>

        <div
          className="flex flex-col w-1/3 "
          data-testid="shipping-contact-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Contact</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.phone
              ? formatPhone(stripPhone(order.shipping_address.phone))
              : ""}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">{order.email}</Text>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-method-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Method</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {(order as any).shipping_methods[0]?.name} (
            {convertToLocale({
              amount: order.shipping_methods?.[0].total ?? 0,
              currency_code: order.currency_code,
            })
              .replace(/,/g, "")
              .replace(/\./g, ",")}
            )
          </Text>
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails

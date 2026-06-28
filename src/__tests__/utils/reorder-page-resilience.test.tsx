import type { ReactElement } from "react"

import ReorderPage from "../../app/[countryCode]/(main)/account/reorder/page"
import { retrieveCustomer } from "@lib/data/customer"
import {
  listAllLegacyCustomerOrders,
  listPurchaseHistory,
} from "@lib/data/orders"
import { getProductsByMedusaLookupRefs } from "@lib/data/strapi/collections"
import { emitOrderHistoryDataFailureAlert } from "@lib/order-history-ops-alerts"

jest.mock("@lib/data/customer", () => ({
  retrieveCustomer: jest.fn(),
}))

jest.mock("@lib/data/orders", () => ({
  listAllLegacyCustomerOrders: jest.fn(),
  listPurchaseHistory: jest.fn(),
}))

jest.mock("@lib/data/strapi/collections", () => ({
  getProductsByMedusaLookupRefs: jest.fn(),
}))

jest.mock("@lib/order-history-ops-alerts", () => ({
  emitOrderHistoryDataFailureAlert: jest.fn(async () => undefined),
}))

jest.mock("@lib/strapi", () => ({
  __esModule: true,
  default: {},
}))

jest.mock("@modules/account/components/reorder-browser", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@modules/account/templates/login-template", () => ({
  __esModule: true,
  default: () => <div data-testid="login-template" />,
}))

const mockRetrieveCustomer = retrieveCustomer as jest.MockedFunction<
  typeof retrieveCustomer
>
const mockListPurchaseHistory = listPurchaseHistory as jest.MockedFunction<
  typeof listPurchaseHistory
>
const mockListAllLegacyCustomerOrders =
  listAllLegacyCustomerOrders as jest.MockedFunction<
    typeof listAllLegacyCustomerOrders
  >
const mockGetProductsByMedusaLookupRefs =
  getProductsByMedusaLookupRefs as jest.MockedFunction<
    typeof getProductsByMedusaLookupRefs
  >
const mockEmitOrderHistoryDataFailureAlert =
  emitOrderHistoryDataFailureAlert as jest.MockedFunction<
    typeof emitOrderHistoryDataFailureAlert
  >

function pagePropsFor(element: ReactElement) {
  return element.props as Record<string, unknown>
}

describe("reorder page resilience", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRetrieveCustomer.mockResolvedValue({
      id: "cus_test",
      email: "customer@example.com",
    } as any)
    mockListPurchaseHistory.mockResolvedValue([
      {
        key: "variant:var_test",
        productId: "prod_test",
        variantId: "var_test",
        sku: "SKU-1",
        title: "Test item",
        productTitle: "Test product",
        thumbnail: null,
        timesOrdered: 1,
        totalQuantity: 1,
        orderCount: 1,
        lastOrderedAt: "2026-06-01T00:00:00.000Z",
        lastOrderRef: "#100",
        unitPrice: 1000,
        reorderable: true,
        source: "medusa",
        mappingStatus: "mapped",
      } as any,
    ])
    mockListAllLegacyCustomerOrders.mockResolvedValue({
      orders: [],
      count: 0,
      limit: 100,
      offset: 0,
    } as any)
  })

  it("renders with history when Strapi reorder enrichment fails", async () => {
    mockGetProductsByMedusaLookupRefs.mockRejectedValue(
      new Error("Connection closed")
    )

    const element = (await ReorderPage({
      params: Promise.resolve({ countryCode: "us" }),
      searchParams: Promise.resolve({ start: "usuals" }),
    })) as ReactElement

    expect(element.type).toBe("div")
    const browserElement = element.props.children[1] as ReactElement
    const props = pagePropsFor(browserElement)

    expect(props.history).toHaveLength(1)
    expect(props.countryCode).toBe("us")
    expect(props.initialAction).toBe("usuals")
    expect(props.strapiMap).toEqual({})
    expect(mockEmitOrderHistoryDataFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "reorder_strapi_enrichment",
        mode: "customer",
        failureCount: 3,
        path: "src/app/[countryCode]/(main)/account/reorder/page.tsx",
      })
    )
  })
})

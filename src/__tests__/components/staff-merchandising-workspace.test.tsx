import { render, screen, waitFor } from "@testing-library/react"
import StaffMerchandisingWorkspace from "@modules/staff/components/merchandising-workspace"

jest.mock("@modules/staff/components/product-merchandising-table", () => ({
  __esModule: true,
  default: ({ tags }: { tags: unknown[] }) => (
    <div data-testid="merchandising-table">{tags.length}</div>
  ),
}))

jest.mock("@lib/client-error-reporter", () => ({
  reportClientOpsAlert: jest.fn(),
}))

import { reportClientOpsAlert } from "@lib/client-error-reporter"

const mockReportClientOpsAlert = reportClientOpsAlert as jest.MockedFunction<
  typeof reportClientOpsAlert
>

describe("StaffMerchandisingWorkspace", () => {
  const mockFetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = mockFetch as unknown as typeof fetch
  })

  it("shows structured API errors without object stringification", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          message: "Strapi GraphQL request failed: Cannot query field products",
        },
      }),
    })

    render(<StaffMerchandisingWorkspace />)

    await waitFor(() => {
      expect(
        screen.getByText(
          "Strapi GraphQL request failed: Cannot query field products"
        )
      ).toBeInTheDocument()
    })
    expect(screen.queryByText("[object Object]")).not.toBeInTheDocument()
    expect(mockReportClientOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "staff_module_load_failed",
        severity: "warn",
        title: "Staff merchandising module failed to load",
        message: "Strapi GraphQL request failed: Cannot query field products",
        extra: expect.objectContaining({
          staff_module: "merchandising",
          endpoint: "/api/staff/catalog-review/groups",
        }),
      })
    )
  })

  it("uses the neutral catalog-review endpoint instead of the blocked merchandising URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: [],
      }),
    })

    render(<StaffMerchandisingWorkspace />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/staff/catalog-review/groups",
        expect.objectContaining({
          cache: "no-store",
          headers: { Accept: "application/json" },
        })
      )
    })
  })

  it("renders the merchandising table after a successful load", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: [{ id: "tag_1" }, { id: "tag_2" }],
      }),
    })

    render(<StaffMerchandisingWorkspace />)

    await waitFor(() => {
      expect(screen.getByTestId("merchandising-table")).toHaveTextContent("2")
    })
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import StaffMerchandisingWorkspace from "@modules/staff/components/merchandising-workspace"

const mockRefresh = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

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

    render(<StaffMerchandisingWorkspace countryCode="us" />)

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
          attempted_endpoints: [
            "/us/account/catalog-review/groups",
            "/us/api/catalog-review/groups",
            "/us/api/staff/catalog-review/groups",
          ],
        }),
      })
    )
  })

  it("uses the country-scoped account catalog-review endpoint first", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: [],
      }),
    })

    render(<StaffMerchandisingWorkspace countryCode="us" />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/us/account/catalog-review/groups",
        expect.objectContaining({
          cache: "no-store",
          headers: { Accept: "application/json" },
        })
      )
    })
  })

  it("renders server-loaded merchandising tags without an initial API fetch", async () => {
    render(
      <StaffMerchandisingWorkspace
        countryCode="us"
        initialTags={[
          {
            documentId: "L3%3A%20Brisket",
            name: "L3: Brisket",
            displayName: "Brisket",
            productCount: 2,
            imageCount: 4,
            reviewedImageCount: 1,
            approvedImageCount: 1,
            rejectedImageCount: 0,
            claimedImageCount: 0,
            noImageProductCount: 0,
            metadata: [],
            l2Parents: ["Beef"],
          },
        ]}
      />
    )

    expect(screen.getByTestId("merchandising-table")).toHaveTextContent("1")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("falls back to the JSON feed when the server preload reports an error", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: [{ id: "tag_1" }],
      }),
    })

    render(
      <StaffMerchandisingWorkspace
        countryCode="us"
        initialError="An error occurred with your deployment"
      />
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/us/account/catalog-review/groups",
        expect.objectContaining({
          cache: "no-store",
          headers: { Accept: "application/json" },
        })
      )
      expect(screen.getByTestId("merchandising-table")).toHaveTextContent("1")
    })
    expect(
      screen.queryByText("An error occurred with your deployment")
    ).not.toBeInTheDocument()
  })

  it("falls back to API feeds when a browser filter blocks the account feed", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Blocked by client"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tags: [{ id: "tag_1" }],
        }),
      })

    render(<StaffMerchandisingWorkspace countryCode="us" />)

    await waitFor(() => {
      expect(screen.getByTestId("merchandising-table")).toHaveTextContent("1")
    })

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/us/account/catalog-review/groups",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/us/api/catalog-review/groups",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
    )
    expect(mockReportClientOpsAlert).not.toHaveBeenCalled()
  })

  it("renders the merchandising table after a successful load", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: [{ id: "tag_1" }, { id: "tag_2" }],
      }),
    })

    render(<StaffMerchandisingWorkspace countryCode="us" />)

    await waitFor(() => {
      expect(screen.getByTestId("merchandising-table")).toHaveTextContent("2")
    })
  })
})

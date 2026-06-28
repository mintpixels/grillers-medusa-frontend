import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import {
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch"

import { SearchBody } from "@modules/search/templates"

jest.mock("react-instantsearch", () => ({
  Configure: () => null,
  InstantSearch: ({ children }: { children: ReactNode }) => children,
  useHits: jest.fn(),
  useInstantSearch: jest.fn(),
  useSearchBox: jest.fn(),
}))

jest.mock("@lib/algolia", () => ({
  searchLiteClient: {},
}))

jest.mock("@lib/algolia/indexes", () => ({
  PRODUCT_INDEX: "test_products",
}))

jest.mock("@lib/data/products", () => ({
  enrichStrapiProductsWithMedusaPrices: jest.fn(async (products) => products),
}))

jest.mock("@lib/jitsu", () => ({
  jitsuTrack: jest.fn(),
}))

jest.mock("@modules/collections/components/strapi-product-grid", () => ({
  __esModule: true,
  default: ({ products }: { products: unknown[] }) => (
    <div data-testid="product-grid">{products.length}</div>
  ),
}))

const mockUseHits = useHits as jest.MockedFunction<typeof useHits>
const mockUseSearchBox = useSearchBox as jest.MockedFunction<typeof useSearchBox>
const mockUseInstantSearch = useInstantSearch as jest.MockedFunction<
  typeof useInstantSearch
>

describe("SearchBody loading state", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHits.mockReturnValue({ items: [] } as any)
    mockUseSearchBox.mockReturnValue({ query: "" } as any)
  })

  it("does not show a no-results state while Algolia is still loading", () => {
    mockUseInstantSearch.mockReturnValue({ status: "loading" } as any)

    render(<SearchBody initialQuery="chicken" countryCode="us" />)

    expect(mockUseInstantSearch).toHaveBeenCalledWith({ catchError: true })
    expect(screen.getByRole("status")).toHaveTextContent(
      /Searching for .chicken./
    )
    expect(screen.queryByText(/No results for .chicken./)).not.toBeInTheDocument()
  })

  it("shows no-results only after the search is idle", () => {
    mockUseInstantSearch.mockReturnValue({ status: "idle" } as any)

    render(<SearchBody initialQuery="chicken" countryCode="us" />)

    expect(screen.getByText(/No results for .chicken./)).toBeInTheDocument()
  })

  it("shows provider unavailable instead of no-results when Algolia errors", () => {
    mockUseInstantSearch.mockReturnValue({
      error: new Error("Unreachable hosts"),
      status: "error",
    } as any)

    render(<SearchBody initialQuery="chicken" countryCode="us" />)

    expect(screen.getByRole("status")).toHaveTextContent(
      /Product search is temporarily unavailable/
    )
    expect(screen.queryByText(/No results for .chicken./)).not.toBeInTheDocument()
  })
})

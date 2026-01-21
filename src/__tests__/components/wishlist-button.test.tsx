import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import WishlistButton from "@modules/products/components/wishlist-button"

// Mock the server action
jest.mock("@lib/data/wishlist", () => ({
  toggleWishlist: jest.fn(),
}))

import { toggleWishlist } from "@lib/data/wishlist"

const mockToggle = toggleWishlist as jest.MockedFunction<typeof toggleWishlist>

describe("WishlistButton", () => {
  const defaultProps = {
    productId: "prod_123",
    productHandle: "test-product",
    title: "Test Product",
    thumbnail: "https://example.com/image.jpg",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders icon variant by default", () => {
    render(<WishlistButton {...defaultProps} />)
    
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-label", "Add Test Product to wishlist")
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("renders button variant when specified", () => {
    render(<WishlistButton {...defaultProps} variant="button" />)
    
    const button = screen.getByRole("button")
    expect(screen.getByText("Save")).toBeInTheDocument()
  })

  it("shows wishlisted state when initialWishlisted is true", () => {
    render(<WishlistButton {...defaultProps} initialWishlisted={true} />)
    
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-pressed", "true")
    expect(button).toHaveAttribute("aria-label", "Remove Test Product from wishlist")
  })

  it("toggles wishlist state on click", async () => {
    mockToggle.mockResolvedValue({
      success: true,
      isWishlisted: true,
    })

    render(<WishlistButton {...defaultProps} />)
    
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-pressed", "false")

    await userEvent.click(button)

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-pressed", "true")
    })

    expect(mockToggle).toHaveBeenCalledWith(
      "prod_123",
      "test-product",
      "Test Product",
      "https://example.com/image.jpg"
    )
  })

  it("removes from wishlist when already wishlisted", async () => {
    mockToggle.mockResolvedValue({
      success: true,
      isWishlisted: false,
    })

    render(<WishlistButton {...defaultProps} initialWishlisted={true} />)
    
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(button)

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-pressed", "false")
    })
  })

  it("disables button while toggling", async () => {
    mockToggle.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, isWishlisted: true }), 100))
    )

    render(<WishlistButton {...defaultProps} />)
    
    const button = screen.getByRole("button")
    await userEvent.click(button)

    expect(button).toBeDisabled()

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it("shows Saved text in button variant when wishlisted", async () => {
    mockToggle.mockResolvedValue({
      success: true,
      isWishlisted: true,
    })

    render(<WishlistButton {...defaultProps} variant="button" />)
    
    expect(screen.getByText("Save")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument()
    })
  })
})

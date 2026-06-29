import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"

import ProductMerchandisingDetailView from "@modules/staff/components/product-merchandising-detail"

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    unoptimized: _unoptimized,
    priority: _priority,
    ...props
  }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

jest.mock("@lib/data/staff/product-merchandising", () => ({
  claimMerchandisingImage: jest.fn(),
  releaseMerchandisingImageClaim: jest.fn(),
  reviewMerchandisingImage: jest.fn(),
}))

jest.mock("@modules/common/components/localized-client-link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const reviewedAt = "2026-06-28T14:00:00.000Z"

const detail = {
  documentId: "tag_beef",
  name: "L3: Beef",
  displayName: "Beef",
  description: "",
  seoDescription: "",
  productCount: 1,
  imageCount: 2,
  reviewedImageCount: 1,
  approvedImageCount: 1,
  rejectedImageCount: 0,
  claimedImageCount: 0,
  noImageProductCount: 0,
  metadata: [],
  l2Parents: ["Butcher Counter"],
  products: [
    {
      documentId: "product_ground_beef",
      title: "Ground Beef",
      description: "Fresh ground beef.",
      handle: "ground-beef",
      sku: "1-00-11-1",
      metadata: ["Pack size: 1 lb"],
      l2Tags: ["L2: Butcher Counter"],
      l3Tags: ["L3: Beef"],
      images: [
        {
          id: 101,
          documentId: "img_hero",
          role: "featured" as const,
          name: "Ground beef hero",
          url: "https://cdn.example.com/ground-beef.jpg",
          displayUrl: "https://cdn.example.com/ground-beef.jpg",
          thumbnailUrl: "https://cdn.example.com/ground-beef-thumb.jpg",
          alternativeText: "Ground beef on butcher paper",
          caption: null,
          review: {
            status: "approved" as const,
            reviewerName: "Miriam Reviewer",
            reviewerEmail: "miriam@example.com",
            reviewedAt,
            note: "Looks accurate and customer-safe.",
          },
          auditHistory: [
            {
              action: "reviewed" as const,
              at: reviewedAt,
              staffName: "Miriam Reviewer",
              staffEmail: "miriam@example.com",
              review: {
                status: "approved" as const,
                reviewerName: "Miriam Reviewer",
                reviewerEmail: "miriam@example.com",
                reviewedAt,
                note: "Looks accurate and customer-safe.",
              },
            },
          ],
        },
        {
          id: 102,
          documentId: "img_open",
          role: "gallery" as const,
          name: "Ground beef alternate",
          url: "https://cdn.example.com/ground-beef-alt.jpg",
          displayUrl: "https://cdn.example.com/ground-beef-alt.jpg",
          thumbnailUrl: "https://cdn.example.com/ground-beef-alt-thumb.jpg",
          alternativeText: "Ground beef alternate",
          caption: null,
          review: {
            status: "unreviewed" as const,
          },
          auditHistory: [],
        },
      ],
    },
  ],
}

describe("ProductMerchandisingDetailView", () => {
  it("shows reviewed status with reviewer and opens image comments", async () => {
    const user = userEvent.setup()

    render(
      <ProductMerchandisingDetailView
        countryCode="us"
        detail={detail}
        staffEmail="avi@example.com"
        staffName="Avi Swerdlow"
      />
    )

    expect(screen.getAllByText("Reviewed").length).toBeGreaterThan(0)
    expect(screen.getByText("Approved by Miriam Reviewer")).toBeInTheDocument()
    expect(
      screen.getByText("Comment: Looks accurate and customer-safe.")
    ).toBeInTheDocument()
    expect(screen.getByText("Needs review")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reserve while reviewing" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Claim" })
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: "Open review details for Ground beef hero",
      })
    )

    const dialog = screen.getByRole("dialog", {
      name: "Ground beef hero",
    })
    expect(
      within(dialog).getByRole("heading", { name: "Ground beef hero" })
    ).toBeInTheDocument()
    expect(within(dialog).getByText("Miriam Reviewer")).toBeInTheDocument()
    expect(
      within(dialog).getAllByText("Looks accurate and customer-safe.").length
    ).toBeGreaterThan(0)
    expect(within(dialog).getByText("Reviewed: Approved")).toBeInTheDocument()
  })
})

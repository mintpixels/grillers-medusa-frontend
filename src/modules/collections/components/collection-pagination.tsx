"use client"

interface CollectionPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function CollectionPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CollectionPaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []

  // Always show first page
  pages.push(1)

  if (currentPage > 3) {
    pages.push("...")
  }

  // Show pages around current
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++
  ) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push("...")
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-maison-neue text-Charcoal border border-Charcoal/20 rounded hover:bg-Charcoal/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        Prev
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 py-2 text-sm text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm font-maison-neue rounded border transition-colors ${
              page === currentPage
                ? "bg-Charcoal text-white border-Charcoal"
                : "text-Charcoal border-Charcoal/20 hover:bg-Charcoal/5"
            }`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-maison-neue text-Charcoal border border-Charcoal/20 rounded hover:bg-Charcoal/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}

"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "16px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Something went wrong
            </h1>
            <p style={{ fontSize: "16px", color: "#666", marginBottom: "8px" }}>
              We apologize for the inconvenience. An unexpected error has
              occurred.
            </p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Please try again or return to the homepage.
            </p>
          </div>

          <div
            style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: "12px 24px",
                backgroundColor: "#333",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Try again
            </button>

            <a
              href="/"
              style={{
                padding: "12px 24px",
                color: "#0070f3",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Go to homepage
            </a>
          </div>

          {error?.digest && (
            <p style={{ fontSize: "12px", color: "#999", marginTop: "16px" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}


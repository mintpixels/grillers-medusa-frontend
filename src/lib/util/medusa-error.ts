export default function medusaError(error: any): never {
  // Handle Medusa JS SDK v2 FetchError (uses fetch, not Axios)
  if (error.status && error.statusText) {
    console.error("Medusa API error:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    })

    const message = error.message || error.statusText || "An unknown error occurred"
    throw new Error(message.charAt(0).toUpperCase() + message.slice(1))
  }

  // Handle Axios-style errors (legacy)
  if (error.response) {
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    const message = error.response.data.message || error.response.data
    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + ".")
  } else if (error.request) {
    throw new Error("No response received: " + error.request)
  } else {
    // Generic error - surface the actual message
    console.error("Medusa request error:", error)
    throw new Error(error.message || "An unknown error occurred")
  }
}

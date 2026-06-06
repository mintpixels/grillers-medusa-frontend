type RecoverableError = Error & { digest?: string }

const transientErrorNeedles = [
  "aborterror",
  "aborted",
  "cancelled",
  "canceled",
  "chunkloaderror",
  "connection closed",
  "dynamically imported module",
  "failed to fetch",
  "fetch server response",
  "loading chunk",
  "network connection lost",
  "networkerror",
  "rsc payload",
  "server response",
  "timeout",
]

function errorText(error: RecoverableError) {
  return `${error?.name || ""} ${error?.message || ""}`.toLowerCase()
}

export function isTransientNavigationError(error: RecoverableError) {
  const message = errorText(error)
  return transientErrorNeedles.some((needle) => message.includes(needle))
}

export function shouldRetryTransientNavigationError(
  scope: string,
  error: RecoverableError
) {
  if (
    typeof window === "undefined" ||
    !isTransientNavigationError(error)
  ) {
    return false
  }

  const errorKey = [
    scope,
    window.location.pathname,
    error.digest || error.message || error.name || "unknown",
  ].join(":")

  try {
    if (sessionStorage.getItem(errorKey) === "true") return false
    sessionStorage.setItem(errorKey, "true")
    return true
  } catch {
    return false
  }
}

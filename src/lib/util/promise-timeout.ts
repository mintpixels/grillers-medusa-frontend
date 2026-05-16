export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  label?: string
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>

  const timer = new Promise<T>((resolve) => {
    timeout = setTimeout(() => {
      if (label) {
        console.warn(`${label} timed out after ${timeoutMs}ms`)
      }
      resolve(fallback)
    }, timeoutMs)
  })

  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout))
}

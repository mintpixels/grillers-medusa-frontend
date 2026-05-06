import { notFound } from "next/navigation"

// Catch-all for unmatched URLs inside the (main) route group. Calling
// notFound() here triggers the closest not-found.tsx — which is the
// branded "We can't find that cut." page in this segment, not the
// generic root fallback. Without this, paths like /us/foobar-baz walk
// up to the root not-found and get the bare Next.js stub. (#79)
export default function CatchAll() {
  notFound()
}

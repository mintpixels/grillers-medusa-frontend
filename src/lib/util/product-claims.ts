const KISHKE_RE = /(?:^|[-\s])kishke(?:[-\s]|$)/i
const IN_HOUSE_CLAIM_RE =
  /\b(?:house[-\s]?made|made[-\s]?in[-\s]?house|in[-\s]?house|housemade)\b/i
const IN_HOUSE_CLAIM_GLOBAL_RE =
  /\b(?:house[-\s]?made|made[-\s]?in[-\s]?house|in[-\s]?house|housemade)\b/gi

type ProductClaimIdentity = {
  handle?: string | null
  title?: string | null
}

export function isKishkeProduct({
  handle,
  title,
}: ProductClaimIdentity): boolean {
  return Boolean(
    (handle && KISHKE_RE.test(handle)) || (title && KISHKE_RE.test(title))
  )
}

export function suppressInvalidProductTag(
  tag: string | undefined,
  product: ProductClaimIdentity
): string | undefined {
  if (!tag) return tag
  if (isKishkeProduct(product) && IN_HOUSE_CLAIM_RE.test(tag)) return undefined
  return tag
}

export function sanitizeProductCopy(
  copy: string | null | undefined,
  product: ProductClaimIdentity
): string {
  if (!copy) return ""
  if (!isKishkeProduct(product)) return copy

  return copy
    .replace(IN_HOUSE_CLAIM_GLOBAL_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim()
}

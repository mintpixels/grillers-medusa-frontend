export function formatPhone(phone: string): string {
  if (phone.length === 0) return ""
  if (phone.length <= 3) return `(${phone}`
  if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
}

export function stripPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10)
}

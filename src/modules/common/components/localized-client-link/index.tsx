"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  const params = useParams()
  // Handle both string and string[] cases from useParams
  const rawCountryCode = params?.countryCode
  const countryCode = Array.isArray(rawCountryCode) 
    ? rawCountryCode[0] 
    : (rawCountryCode || "us")

  return (
    <Link href={`/${countryCode}${href}`} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink

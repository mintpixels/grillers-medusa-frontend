"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type AnnouncementBarProps = {
  message: string
  linkUrl?: string
  linkText?: string
  backgroundColor?: string
  textColor?: string
  startDate?: string
  endDate?: string
  dismissible: boolean
}

export default function AnnouncementBar({
  message,
  linkUrl,
  linkText,
  backgroundColor = "#1A1A1A",
  textColor = "#FFFFFF",
  startDate,
  endDate,
  dismissible,
}: AnnouncementBarProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed this announcement in current session
    const dismissed = sessionStorage.getItem("announcement_dismissed")
    if (dismissed === "true") {
      setIsDismissed(true)
    }
  }, [])

  // Check if announcement is within active date range
  const isWithinDateRange = () => {
    const now = new Date()
    
    if (startDate) {
      const start = new Date(startDate)
      if (now < start) return false
    }
    
    if (endDate) {
      const end = new Date(endDate)
      if (now > end) return false
    }
    
    return true
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem("announcement_dismissed", "true")
  }

  // Don't show if dismissed or outside date range
  if (isDismissed || !isWithinDateRange()) {
    return null
  }

  return (
    <div
      className="w-full py-3 px-4 relative"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="content-container flex items-center justify-center gap-4">
        <p className="text-sm md:text-base text-center flex-1">{message}</p>
        
        {linkUrl && linkText && (
          <Link
            href={linkUrl}
            className="text-sm font-semibold underline hover:opacity-80 transition whitespace-nowrap"
            style={{ color: textColor }}
          >
            {linkText}
          </Link>
        )}

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-2 text-xl hover:opacity-80 transition-opacity"
            aria-label="Dismiss announcement"
            style={{ color: textColor }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}





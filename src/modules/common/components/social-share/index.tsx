"use client"

import { useState } from "react"

type SocialShareProps = {
  url: string
  title: string
  description?: string
  imageUrl?: string
  variant?: "default" | "compact"
}

type SharePlatform = "pinterest" | "facebook" | "twitter" | "copy"

const SocialIcon = ({ platform }: { platform: SharePlatform }) => {
  const iconClass = "w-5 h-5 fill-current"

  switch (platform) {
    case "pinterest":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      )
    case "facebook":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case "twitter":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case "copy":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
      )
  }
}

export default function SocialShare({
  url,
  title,
  description = "",
  imageUrl = "",
  variant = "default",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const encodedImage = encodeURIComponent(imageUrl)

  const shareLinks = {
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleShare = (platform: SharePlatform) => {
    if (platform === "copy") {
      handleCopyLink()
      return
    }

    const shareUrl = shareLinks[platform]
    window.open(shareUrl, "_blank", "width=600,height=400,noopener,noreferrer")
  }

  const platforms: SharePlatform[] = ["pinterest", "facebook", "twitter", "copy"]

  const buttonBaseClass =
    variant === "compact"
      ? "p-2 rounded-full transition-colors"
      : "p-3 rounded-full transition-colors"

  return (
    <div className="flex items-center gap-2">
      {variant === "default" && (
        <span className="text-p-sm font-maison-neue text-Charcoal/60 mr-2">
          Share:
        </span>
      )}
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => handleShare(platform)}
          className={`${buttonBaseClass} bg-Charcoal/5 hover:bg-Charcoal/10 text-Charcoal/70 hover:text-Charcoal`}
          aria-label={
            platform === "copy"
              ? copied
                ? "Link copied!"
                : "Copy link"
              : `Share on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`
          }
          title={
            platform === "copy"
              ? copied
                ? "Link copied!"
                : "Copy link"
              : `Share on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`
          }
        >
          {platform === "copy" && copied ? (
            <svg
              className="w-5 h-5 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <SocialIcon platform={platform} />
          )}
        </button>
      ))}
    </div>
  )
}



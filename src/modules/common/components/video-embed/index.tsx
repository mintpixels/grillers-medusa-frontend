"use client"

type VideoEmbedProps = {
  url: string
  title?: string
}

/**
 * Extracts video ID and platform from YouTube or Vimeo URLs
 */
function parseVideoUrl(url: string): { platform: "youtube" | "vimeo" | null; videoId: string | null } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match) {
      return { platform: "youtube", videoId: match[1] }
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ]

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern)
    if (match) {
      return { platform: "vimeo", videoId: match[1] }
    }
  }

  return { platform: null, videoId: null }
}

export default function VideoEmbed({ url, title = "Video" }: VideoEmbedProps) {
  const { platform, videoId } = parseVideoUrl(url)

  if (!platform || !videoId) {
    return null
  }

  const embedUrl =
    platform === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
      : `https://player.vimeo.com/video/${videoId}?dnt=1`

  return (
    <div className="relative w-full aspect-video rounded-[5px] overflow-hidden shadow-sm bg-Charcoal/5">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        loading="lazy"
      />
    </div>
  )
}

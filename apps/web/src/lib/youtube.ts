// Extract a YouTube video id from common URL forms:
//   https://www.youtube.com/watch?v=ID
//   https://youtu.be/ID
//   https://www.youtube.com/embed/ID
//   https://www.youtube.com/shorts/ID
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
]

export function youtubeIdFromUrl(url: string): string | null {
  for (const re of YOUTUBE_PATTERNS) {
    const m = url.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

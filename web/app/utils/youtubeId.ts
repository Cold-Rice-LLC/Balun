// Matches watch?v=, youtu.be/, live/, shorts/ and embed/ URLs — the same
// pattern the studio validates against (studio/schemaTypes/lib/youtube.js);
// group 1 is the ID. `live/` is the form YouTube gives a live broadcast.
const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/

// The video ID in a YouTube URL of any shape, or null if it isn't one.
export const youtubeId = (url?: string | null) => url?.match(YOUTUBE_ID_PATTERN)?.[1] ?? null

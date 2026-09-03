/**
 * YouTube URL handling, shared by every field that takes one (the home/info
 * video module, the Live page's stream source).
 */

// Matches watch?v=, youtu.be/, live/, shorts/ and embed/ URLs; group 1 is
// the ID. `live/` is the form YouTube gives a live broadcast.
export const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/

// Validation for a YouTube URL field that only applies in some modes:
// `appliesTo` reads the validation context and says whether the field is in
// play — required and parseable when it is, ignored when it isn't.
export const youtubeUrlRule = (appliesTo) => (Rule) =>
  Rule.custom((value, context) => {
    if (!appliesTo(context)) return true
    if (!value) return 'YouTube URL is required.'
    return YOUTUBE_ID_PATTERN.test(value) ? true : 'Not a recognizable YouTube video URL.'
  })

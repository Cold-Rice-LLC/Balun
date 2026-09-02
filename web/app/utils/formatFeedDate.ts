// Numeric mm.dd.yyyy per the feed card mockups — the same in every language.
export const formatFeedDate = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${d.getFullYear()}`
}

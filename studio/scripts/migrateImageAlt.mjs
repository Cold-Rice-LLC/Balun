/* global process, console */
/**
 * One-off migration: image `alt` (the shared altField) went from a plain
 * string to an internationalizedArrayString, so screen-reader text can be
 * translated like every other editorial field. Walks every document (drafts
 * included) and wraps each string alt as its English value; empty strings are
 * removed instead. Alts already migrated are left alone. The machine-owned
 * product `store` object is skipped — Sanity Connect owns it.
 *
 * Run from studio/, with your own login:
 *
 *   npx sanity exec scripts/migrateImageAlt.mjs --with-user-token
 *
 * Dry by default — it prints what it would write. Add --commit to write:
 *
 *   npx sanity exec scripts/migrateImageAlt.mjs --with-user-token -- --commit
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'})

const COMMIT = process.argv.includes('--commit')

const randomKey = () => Math.random().toString(36).slice(2, 14)

const item = (language, value) => ({
  _key: randomKey(),
  _type: 'internationalizedArrayStringValue',
  language,
  value,
})

// Every string `alt` under `node`, as [path, value] pairs. Array items are
// addressed by _key so the patch paths survive reordering.
const findStringAlts = (node, path = '') => {
  if (Array.isArray(node)) {
    return node.flatMap((child) =>
      typeof child?._key === 'string' ? findStringAlts(child, `${path}[_key=="${child._key}"]`) : [],
    )
  }
  if (!node || typeof node !== 'object') return []
  const found = []
  if (typeof node.alt === 'string') found.push([path ? `${path}.alt` : 'alt', node.alt])
  for (const [key, child] of Object.entries(node)) {
    if (key === 'alt' || key === 'store') continue
    found.push(...findStringAlts(child, path ? `${path}.${key}` : key))
  }
  return found
}

// Everything but Sanity's own system documents, drafts included.
const docs = await client.fetch(
  `*[!(_type match "sanity.*") && !(_type match "system.*")]`,
  {},
  {perspective: 'raw'},
)

let total = 0
for (const doc of docs) {
  const alts = findStringAlts(doc)
  if (!alts.length) continue
  const patch = client.patch(doc._id)
  for (const [path, value] of alts) {
    if (value === '') {
      console.log(`${doc._id} ${path}: "" → (unset)`)
      patch.unset([path])
    } else {
      console.log(`${doc._id} ${path}: "${value}" → en: "${value}"`)
      patch.set({[path]: [item('en', value)]})
    }
  }
  if (COMMIT) await patch.commit()
  console.log(`${doc._id}: ${COMMIT ? 'wrote' : 'would write'} ${alts.length} alt(s).`)
  total += alts.length
}

console.log(`${docs.length} document(s) checked, ${total} alt(s) ${COMMIT ? 'migrated' : 'to migrate'}.`)
if (!COMMIT && total) console.log('Re-run with --commit to write.')

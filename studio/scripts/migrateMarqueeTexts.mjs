/* global process, console */
/**
 * One-time migration: the marquee module had a single `text`; it has a
 * `texts` list now. This moves each marquee's text into the first entry of
 * that list.
 *
 * Run from studio/, with your own login:
 *
 *   npx sanity exec scripts/migrateMarqueeTexts.mjs --with-user-token
 *
 * Dry by default — it prints what it would write. Add --commit to write:
 *
 *   npx sanity exec scripts/migrateMarqueeTexts.mjs --with-user-token -- --commit
 *
 * The legacy `text` is left in place until cleared (the Studio flags it as an
 * unknown field until then), so a site still reading it keeps working:
 *
 *   npx sanity exec scripts/migrateMarqueeTexts.mjs --with-user-token -- --cleanup --commit
 *
 * Safe to re-run — marquees that already have texts are left alone, and
 * cleanup only clears `text` on marquees that have texts. Drafts are migrated
 * alongside published documents.
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'})

const COMMIT = process.argv.includes('--commit')
const CLEANUP = process.argv.includes('--cleanup')

const randomKey = () => Math.random().toString(36).slice(2, 14)

const docs = await client.fetch(
  `*[_type == "homePage" && count(modules[_type == "moduleMarquee"]) > 0]{
    _id,
    "marquees": modules[_type == "moduleMarquee"]{_key, text, texts}
  }`,
)

let writes = 0
for (const doc of docs) {
  const patch = client.patch(doc._id)
  let touched = false

  for (const marquee of doc.marquees) {
    const path = `modules[_key=="${marquee._key}"]`
    const label = marquee.text?.find((item) => item.language === 'en')?.value ?? '(no English)'

    if (CLEANUP) {
      if (marquee.text && marquee.texts?.length) {
        console.log(`${doc._id} ${marquee._key}: clear text "${label}"`)
        patch.unset([`${path}.text`])
        touched = true
      }
    } else if (marquee.text?.length && !marquee.texts?.length) {
      console.log(`${doc._id} ${marquee._key}: texts ← "${label}"`)
      patch.set({
        [`${path}.texts`]: [{_key: randomKey(), _type: 'marqueeText', text: marquee.text}],
      })
      touched = true
    }
  }

  if (touched) {
    writes++
    if (COMMIT) await patch.commit()
  }
}

console.log(
  writes
    ? `${COMMIT ? 'Wrote' : 'Would write'} ${writes} document(s).${COMMIT ? '' : ' Re-run with --commit to write.'}`
    : 'Nothing to do.',
)

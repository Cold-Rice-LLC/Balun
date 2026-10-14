/* global process, console */
/**
 * Temporary: replaces every product's Description (`body`) with one shared
 * piece of placeholder copy until real per-product copy is written.
 *
 * Run from studio/, with your own login:
 *
 *   npx sanity exec scripts/setPlaceholderProductBody.mjs --with-user-token
 *
 * Dry by default — it prints what it would write. Add --commit to write:
 *
 *   npx sanity exec scripts/setPlaceholderProductBody.mjs --with-user-token -- --commit
 *
 * English only: any other translation is dropped, so those languages fall
 * back to the English copy. Drafts are updated alongside published documents.
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'})

const COMMIT = process.argv.includes('--commit')

const COPY =
  "This is the shoe Speed hands you when he says yes. Not a performance shoe — a permission shoe. Lightweight foam, all-day comfort, ready for wherever the day takes you: the walk, the game, the dare you didn't see coming. Say yes and keep moving."

const randomKey = () => Math.random().toString(36).slice(2, 14)

const body = [
  {
    _key: randomKey(),
    _type: 'internationalizedArrayBlockContentValue',
    language: 'en',
    value: [
      {
        _key: randomKey(),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: randomKey(), _type: 'span', marks: [], text: COPY}],
      },
    ],
  },
]

const docs = await client.fetch(
  `*[_type == "product"]{_id, "title": store.title}`,
  {},
  {perspective: 'raw'},
)

for (const doc of docs) {
  console.log(`${doc._id} (${doc.title}): body ← placeholder`)
  if (COMMIT) await client.patch(doc._id).set({body}).commit()
}

console.log(
  `${COMMIT ? 'Wrote' : 'Would write'} ${docs.length} document(s).${COMMIT ? '' : ' Re-run with --commit to write.'}`,
)

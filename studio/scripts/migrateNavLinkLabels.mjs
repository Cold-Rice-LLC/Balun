/* global process, console */
/**
 * One-off migration: navLink.label went from a plain string to an
 * internationalizedArrayString, so the footer's link labels can be translated
 * like every other editorial field. Wraps each string label in Site Settings
 * as its English value (and adds Spanish for the policy links, matching the
 * legal pages' titles). Labels already migrated are left alone.
 *
 * Run from studio/, with your own login:
 *
 *   npx sanity exec scripts/migrateNavLinkLabels.mjs --with-user-token
 *
 * Dry by default — it prints what it would write. Add --commit to write:
 *
 *   npx sanity exec scripts/migrateNavLinkLabels.mjs --with-user-token -- --commit
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'})

const COMMIT = process.argv.includes('--commit')

// Spanish for labels that aren't proper names. Anything else (social networks)
// keeps English only and renders through the English fallback.
const SPANISH = {
  'Privacy Policy': 'Política de privacidad',
  'Terms & Conditions': 'Términos y condiciones',
  Returns: 'Devoluciones',
}

const randomKey = () => Math.random().toString(36).slice(2, 14)

const item = (language, value) => ({
  _key: randomKey(),
  _type: 'internationalizedArrayStringValue',
  language,
  value,
})

const migrate = (label) => {
  if (typeof label !== 'string') return label
  const items = [item('en', label)]
  if (SPANISH[label]) items.push(item('es', SPANISH[label]))
  return items
}

const docs = await client.fetch(
  `*[_type == "siteSettings"]{_id, footerPrimaryLinks, footerSecondaryLinks}`,
  {},
  {perspective: 'raw'},
)

for (const doc of docs) {
  const patch = client.patch(doc._id)
  let changes = 0
  for (const field of ['footerPrimaryLinks', 'footerSecondaryLinks']) {
    for (const link of doc[field] ?? []) {
      if (typeof link.label !== 'string') continue
      const next = migrate(link.label)
      console.log(`${doc._id} ${field}[${link._key}].label: "${link.label}" → ${next.map((i) => `${i.language}: "${i.value}"`).join(', ')}`)
      patch.set({[`${field}[_key=="${link._key}"].label`]: next})
      changes++
    }
  }
  if (changes && COMMIT) await patch.commit()
  console.log(`${doc._id}: ${COMMIT ? 'wrote' : 'would write'} ${changes} label(s).`)
}

if (!COMMIT) console.log('Re-run with --commit to write.')

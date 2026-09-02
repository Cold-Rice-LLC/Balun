/* global process, console */
/**
 * One-off: feedPost.body (rich text) → feedPost.modules[0] (a Text module).
 * The body field was replaced by the modular `modules` array; this carries
 * existing content over so nothing is lost, then unsets `body` so the Studio
 * stops flagging it as an unknown field. Posts without a body are skipped;
 * posts that already have modules get the text prepended.
 *
 * Run from studio/:   npx sanity exec scripts/migrateFeedBodyToModules.mjs --with-user-token
 * Dry run:            npx sanity exec scripts/migrateFeedBodyToModules.mjs --with-user-token -- --dry
 */
import {getCliClient} from 'sanity/cli'
import {randomUUID} from 'node:crypto'

const dry = process.argv.includes('--dry')
const client = getCliClient({apiVersion: '2024-10-01'})

const posts = await client.fetch(`*[_type == "feedPost" && defined(body)]{_id, body, modules}`)
console.log(`${posts.length} post(s) with a body`)

for (const post of posts) {
  const textModule = {_type: 'moduleFeedText', _key: randomUUID().slice(0, 12), body: post.body}
  const modules = [textModule, ...(post.modules ?? [])]
  console.log(`${dry ? '[dry] ' : ''}${post._id}: body → Text module (${modules.length} module(s))`)
  if (dry) continue
  await client.patch(post._id).set({modules}).unset(['body']).commit()
}
console.log(dry ? 'Dry run — nothing written.' : 'Done.')

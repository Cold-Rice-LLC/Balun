/* global process, console */
/**
 * One-time migration: internal links were typed paths (internalPath); they
 * are references now (internalLink). This resolves every stored path to the
 * document standing at that route and writes the reference next to it.
 *
 * Run from studio/, with your own login:
 *
 *   npx sanity exec scripts/migrateInternalLinks.mjs --with-user-token
 *
 * Dry by default — it prints what it would write. Add --commit to write:
 *
 *   npx sanity exec scripts/migrateInternalLinks.mjs --with-user-token -- --commit
 *
 * The legacy paths are left in place until cleared (the Studio flags them as
 * unknown fields until then):
 *
 *   npx sanity exec scripts/migrateInternalLinks.mjs --with-user-token -- --cleanup --commit
 *
 * Safe to re-run — links already carrying a reference are left alone, and
 * cleanup only clears paths whose link has one (or isn't internal). Drafts
 * are migrated alongside published documents. Market-scoped pages resolve to
 * their DEFAULT document (no market) — the site routes any market's version
 * to the same path.
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'})

const COMMIT = process.argv.includes('--commit')
const CLEANUP = process.argv.includes('--cleanup')

// Fixed routes → the default document of that type.
const SINGLETON_TYPES = {
  '/': 'homePage',
  '/info': 'infoPage',
  '/live': 'livePage',
  '/feed': 'feedPage',
}

/**
 * Every object in the document carrying an internalPath, with the patch path
 * to reach it — arrays are addressed by _key so the patch survives reorders.
 */
const findLinkSites = (node, path, out) => {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      const key = item?._key
      findLinkSites(item, `${path}[${key ? `_key=="${key}"` : index}]`, out)
    })
  } else if (node && typeof node === 'object') {
    if (typeof node.internalPath === 'string' && node.internalPath) {
      out.push({
        path,
        internalPath: node.internalPath,
        hasRef: !!node.internalLink,
        linkType: node.linkType,
      })
    }
    for (const [key, value] of Object.entries(node)) {
      if (!key.startsWith('_')) findLinkSites(value, path ? `${path}.${key}` : key, out)
    }
  }
}

/** The _id of the document a stored path points at, or null. */
const resolveTarget = async (internalPath) => {
  const normalized = internalPath.replace(/\/+$/, '') || '/'
  const singleton = SINGLETON_TYPES[normalized]
  if (singleton) {
    return client.fetch(
      `*[_type == $type && !defined(market) && !(_id in path("drafts.**"))][0]._id`,
      {
        type: singleton,
      },
    )
  }
  const segments = normalized.replace(/^\//, '').split('/')
  if (segments.length === 2 && segments[0] === 'products') {
    return client.fetch(`*[_type == "product" && store.slug.current == $slug][0]._id`, {
      slug: segments[1],
    })
  }
  if (segments.length === 2 && segments[0] === 'feed') {
    return client.fetch(
      `*[_type == "feedPost" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
      {slug: segments[1]},
    )
  }
  if (segments.length === 1) {
    return client.fetch(
      `*[_type == "legalPage" && slug.current == $slug && !defined(market) && !(_id in path("drafts.**"))][0]._id`,
      {slug: segments[0]},
    )
  }
  return null
}

const migrate = async () => {
  const docs = await client.fetch(`*[]`, {}, {perspective: 'raw'})
  const patches = []

  for (const doc of docs) {
    const sites = []
    findLinkSites(doc, '', sites)

    for (const site of sites) {
      const label = `${doc._type} ${doc._id} · ${site.path}`

      if (CLEANUP) {
        if (site.linkType === 'internal' && !site.hasRef) {
          console.warn(
            `KEEPING ${label} — internal link with no reference yet: ${site.internalPath}`,
          )
          continue
        }
        console.log(`clear ${label}: ${site.internalPath}`)
        patches.push({id: doc._id, unset: [`${site.path}.internalPath`]})
        continue
      }

      if (site.linkType !== 'internal' || site.hasRef) continue

      const target = await resolveTarget(site.internalPath)
      if (!target) {
        console.warn(`SKIPPING ${label} — nothing found at ${site.internalPath}`)
        continue
      }
      console.log(`link ${label}: ${site.internalPath} -> ${target}`)
      patches.push({
        id: doc._id,
        set: {[`${site.path}.internalLink`]: {_type: 'reference', _ref: target}},
      })
    }
  }

  if (!patches.length) {
    console.log('Nothing to migrate.')
    return
  }
  if (!COMMIT) {
    console.log(`\nDry run — ${patches.length} patch(es) planned. Add --commit to write.`)
    return
  }
  const transaction = client.transaction()
  for (const patch of patches) {
    transaction.patch(patch.id, patch.set ? {set: patch.set} : {unset: patch.unset})
  }
  await transaction.commit()
  console.log(`Committed ${patches.length} patch(es).`)
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})

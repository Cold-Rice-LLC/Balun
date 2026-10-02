/* global process, console */
/**
 * Uploads the cropped product photography and wires it onto the colourway
 * products: featuredImage = OP, featureCarousel = OP, FTQ, T. Colourways with
 * an empty gallery get Speedy 01 · White's gallery images as placeholders.
 *
 * Run from studio/, with your own login:
 *
 *   npx sanity exec scripts/uploadProductImages.mjs --with-user-token
 *
 * Dry by default — it prints what it would write. Add --commit to write:
 *
 *   npx sanity exec scripts/uploadProductImages.mjs --with-user-token -- --commit
 *
 * Expects the shoot export at ~/Downloads/Low-Res JPEG/{Athletic,Slide}/<Colour>/Cropped
 * (override with --dir=<path>). Safe to re-run — Sanity dedupes identical
 * uploads by hash, and alt text on the featured image is kept.
 */
import {createReadStream, existsSync, readdirSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'})

const COMMIT = process.argv.includes('--commit')
const dirArg = process.argv.find((arg) => arg.startsWith('--dir='))
const ROOT = dirArg ? dirArg.slice('--dir='.length) : join(homedir(), 'Downloads', 'Low-Res JPEG')

const CAROUSEL_SHOTS = ['OP', 'FTQ', 'T']
const FEATURED_SHOT = 'OP'
const GALLERY_SOURCE_ID = 'shopifyProduct-15170336522285' // Speedy 01 · White

// Shoot folder → product. Folder colour names don't match product names
// (Slate-Blue is "Blue", Ice-Blue is "Light Blue", Bone is "White").
const PRODUCTS = [
  {folder: 'Athletic/Black', id: 'shopifyProduct-15170337407021'},
  {folder: 'Athletic/Slate-Blue', id: 'shopifyProduct-15170337538093'},
  {folder: 'Athletic/Butter-Yellow', id: 'shopifyProduct-15170337472557'},
  {folder: 'Athletic/Light-Grey', id: 'shopifyProduct-15170338095149'},
  {folder: 'Athletic/Ice-Blue', id: 'shopifyProduct-15406274281517'},
  {folder: 'Athletic/Mint-Green', id: 'shopifyProduct-15406274707501'},
  {folder: 'Athletic/Blush-Pink', id: 'shopifyProduct-15406273724461'},
  {folder: 'Athletic/Red', id: 'shopifyProduct-15406273200173'},
  {folder: 'Athletic/White', id: 'shopifyProduct-15170336522285'},
  {folder: 'Slide/Light-Blue', id: 'shopifyProduct-15406285488173'},
  {folder: 'Slide/Coral-Pink', id: 'shopifyProduct-15406284996653'},
  {folder: 'Slide/Bone', id: 'shopifyProduct-15406282965037'},
  {folder: 'Slide/Yellow', id: 'shopifyProduct-15406285946925'},
]

// Cropped files are named <Line>_<Colour>_<Code>_<Shot>_cropped.jpg
const findShot = (folder, shot) => {
  const dir = join(ROOT, folder, 'Cropped')
  const file = readdirSync(dir).find((name) => name.endsWith(`_${shot}_cropped.jpg`))
  if (!file) throw new Error(`No ${shot} crop in ${dir}`)
  return {path: join(dir, file), filename: file}
}

const uploadCache = new Map()
const upload = async ({path, filename}) => {
  if (!COMMIT) return `<${filename}>`
  if (!uploadCache.has(path)) {
    const asset = await client.assets.upload('image', createReadStream(path), {filename})
    uploadCache.set(path, asset._id)
  }
  return uploadCache.get(path)
}

const imageRef = (assetId) => ({_type: 'reference', _ref: assetId})

if (!existsSync(ROOT)) throw new Error(`Shoot folder not found: ${ROOT}`)

const products = await client.fetch(
  `*[_id in $ids]{_id, "title": store.title, featuredImage, "galleryCount": count(gallery)}`,
  {ids: PRODUCTS.map(({id}) => id)},
)
const byId = new Map(products.map((product) => [product._id, product]))
const missing = PRODUCTS.filter(({id}) => !byId.has(id))
if (missing.length) throw new Error(`Products not found: ${missing.map(({id}) => id).join(', ')}`)

const sourceGallery = await client.fetch(`*[_id == $id][0].gallery`, {id: GALLERY_SOURCE_ID})
if (!sourceGallery?.length) throw new Error('Speedy 01 · White has no gallery to copy')

const transaction = client.transaction()

for (const {folder, id} of PRODUCTS) {
  const product = byId.get(id)
  const featured = findShot(folder, FEATURED_SHOT)
  const slides = CAROUSEL_SHOTS.map((shot) => ({shot, ...findShot(folder, shot)}))

  const featuredImage = {
    ...(product.featuredImage?.alt && {alt: product.featuredImage.alt}),
    _type: 'image',
    asset: imageRef(await upload(featured)),
  }
  const featureCarousel = []
  for (const slide of slides) {
    featureCarousel.push({
      _key: slide.shot.toLowerCase(),
      _type: 'featureImage',
      asset: imageRef(await upload(slide)),
    })
  }

  const patch = {featuredImage, featureCarousel}
  const copyGallery = id !== GALLERY_SOURCE_ID && !product.galleryCount
  if (copyGallery) patch.gallery = sourceGallery

  console.log(`${product.title} (${id})`)
  console.log(`  featuredImage   ${featured.filename}`)
  console.log(`  featureCarousel ${slides.map(({filename}) => filename).join(', ')}`)
  console.log(`  gallery         ${copyGallery ? `copy ${sourceGallery.length} from Speedy 01 · White` : 'unchanged'}`)

  transaction.patch(id, (p) => p.set(patch))
}

if (!COMMIT) {
  console.log('\nDry run — nothing uploaded or written. Re-run with -- --commit to apply.')
} else {
  await transaction.commit()
  console.log(`\nUpdated ${PRODUCTS.length} products.`)
}

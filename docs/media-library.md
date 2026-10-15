# Media Management Plan: Sanity Media Library vs. the Media browser plugin

> Status: **plan, not yet built.** Written October 14, 2026. Companion to
> [shopify-and-localization-strategy.md](./shopify-and-localization-strategy.md) §3 (translated
> editorial fields) and [performance-caching.md](./performance-caching.md) (asset CDN assumptions).

## Context

Editors upload images straight into image fields today. There is no place to browse, tag, search
or reuse the ~130 assets already in the dataset, and nothing shows where an asset is used. Two
Sanity products address this, and they are not interchangeable:

| | **Media Library** (Sanity product) | **Media browser plugin** (`sanity-plugin-media`) |
| --- | --- | --- |
| What it is | Organization-level asset store outside any dataset, with its own API, versions, folders, custom metadata ("aspects"), private assets and signed URLs | A Studio tool + asset source that browses the assets *already in the dataset*, adding tags, folders, search, usage and metadata fields |
| Availability | **Enterprise add-on only** — "Not included" on Free and Growth; priced through sales | Free, open source, maintained by Sanity (`sanity-io` is an npm maintainer); v6.3.5 supports Studio v5 (installed: v5.24) |
| Our plan | This project is on the **Free plan** (3-day history retention, community support; org "Cold Rice LLC" has no media library) | Works today |
| Existing assets | Not copied automatically. Manual script: export → upload → link → re-point every `asset` reference | Already visible — nothing to migrate |
| Web app impact | None for URLs (see below); GROQ gains `media::aspect()` if aspects are used | None — metadata lives on the existing `sanity.imageAsset` documents |

## Recommendation

1. **Adopt the Media browser plugin now.** It delivers the editorial wins (browse, tag, search,
   see usage, reuse an upload across pages) with zero data migration and no plan change.
2. **Treat Media Library as a later upgrade, gated on the client moving to Enterprise.** Design
   nothing now that the upgrade would have to undo (rules below). The plugin even has a
   `showMediaLibraryAssets` option for a mixed period.
3. **Keep alt text on the image field, translated per use**, as the alt-text i18n work does —
   not on the asset. Sanity's own aspects guidance says local metadata belongs in Studio fields,
   and the same photo legitimately needs different alt text on a product card and a feed cover.
   Asset-level metadata (title, description, tags) is for *finding* assets, not for rendering.

## Why the web app doesn't care which one wins

Both paths leave `web/` untouched:

- A Media Library asset used in a dataset is **linked** into the dataset as an ordinary
  `sanity.imageAsset` document (ids like `image-<hash>-<w>x<h>-jpg`), served from
  `https://cdn.sanity.io/images/pful3cpt/production/…` with the usual transform params. The
  image object keeps `asset._ref`, `hotspot` and `crop`, and gains a weak `media` global document
  reference. So `useSanityImage` / `useSanitySrcset` / `useSanityShareImage` and every query
  projection keep working. "Container URLs" (`documents::get(media).url`) are an optional stable
  share link, not a replacement for the transform CDN.
- The plugin writes `title` / `description` / `altText` / `opt.media.tags` onto the asset
  document; nothing we query changes unless we choose to read those fields.
- Assets stay **public** in both cases (dataset assets always are; Media Library uploads default
  to public). Private assets + signed URLs are a Media Library feature we don't need for a
  storefront, and flipping an asset private still leaves it cached on the CDN for up to 30 days.

## Path B — Media browser plugin (do now)

Estimated effort: half a day.

1. **Install and register** in `studio/`:
   ```js
   // sanity.config.js
   import {media} from 'sanity-plugin-media'
   plugins: [structureTool({structure: myStructure}), visionTool(), internationalizedArrayPlugin, colorInput(), media()]
   ```
   The tool appears in the Studio nav and becomes an asset source for every image and file field.
   Leave `locales` **off**: it would make the asset-level `altText` a per-language object and
   create a second alt-text system competing with the field-level one.
2. **Hide tag documents from "create new".** Tags are `media.tag` documents. Add the type to the
   `newDocumentOptions` filter in `sanity.config.js` (next to the Shopify-synced types) so editors
   create tags inside the browser, where deletion also cleans up references.
3. **Pre-filter by context** with the plugin's `mediaField()` helper where it helps editors find
   the right pool: e.g. `mediaTags: ['product']` on `product.featuredImage` / `gallery` /
   `featureCarousel`, `['feed']` on `feedPost.coverImage` / `moduleFeedImage`, `['home']` on the
   hero modules. Selecting an asset applies the tag automatically, so the library tags itself over
   time. This replaces the plain `type: 'image'` definitions in `schemaTypes/lib/fields.js`
   (`mediaFields`) and the per-schema image fields — keep the `alt` subfield exactly as is.
4. **Optional, later:** credit line (`creditLine: {enabled: true}`) if photographers need
   crediting; `maximumUploadSize` to stop 40 MB hero PNGs reaching the CDN.
5. **Verify:** `npx sanity schema validate`; open the Studio, tag a few assets, pick one from the
   browser into a product gallery, confirm the site renders it unchanged (same `asset._ref`).

Known plugin limits: bulk delete is atomic (one referenced asset blocks the batch); downloads are
processed versions, not originals; asset fields can't be edited from the document form.

## Path A — Media Library (when the plan allows)

Prerequisites: Enterprise plan with the add-on enabled for the org; Studio ≥ 3.82 (we're on 5.x);
`sanity` CLI ≥ 3.85.1 for aspects. Estimated effort: 2–3 days including migration and QA.

1. **Enable and connect.**
   ```js
   // sanity.config.js
   mediaLibrary: {enabled: true /*, libraryId: '…' if auto-detect fails */},
   auth: {loginMethod: 'token'},   // cookie auth loses private previews, downloads, usage sync
   ```
   ```js
   // sanity.cli.js
   mediaLibrary: {aspectsPath: 'aspects'},
   ```
2. **Aspects** (asset-level metadata, deployed with `npx sanity media deploy-aspect --all`):
   define a small `rights` aspect (photographer, license, usage window) and a `tags`-style
   categorization aspect, both `public: true` so the site could read them unauthenticated via
   `media::aspect(media, "rights")`. Aspects allow no executable code (no custom validation,
   components or callbacks), so keep them flat. **Do not** put alt text in an aspect (see
   Recommendation 3).
3. **Image-field filters** (Studio ≥ 4.2): `options.mediaLibrary.filters` with GROQ against the
   library, e.g. product shots only on product fields — the Media Library analogue of
   `mediaTags`.
4. **Decide the upload policy.** Keep the default dataset source alongside the library during
   migration; once everything is linked, remove `sanity-default` from `form.image.assetSources`
   and `form.file.assetSources` so every upload lands in the library.
5. **Migrate the existing assets.** No official tool yet (Sanity says one is planned). Adapt
   Sanity's experimental Media-plugin migration script: export the dataset, upload each file
   (`POST /media-libraries/{id}/upload`), link it (`POST
   /assets/media-library-link/{dataset}`, retry on 422 "not ready"), then patch every image object
   to the new `asset._ref` plus the `media` GDR. Hotspot/crop live on the image object and
   survive. Throttle (the reference script does 25 req/s, 10 patches per mutation); downloads and
   mutations count toward usage. Run on a dataset copy first.
6. **API versions.** Mutations that write a `media` GDR need API `2025-02-19` or later. Our write
   path is the Mux webhook (`apiVersion: '2024-10-01'`, patches only `isLive`), so nothing breaks,
   but bump both Studio scripts and `nuxt.config` `sanity.apiVersion` when migrating. Reads are
   unaffected.
7. **Video.** Media Library handles hosted video (public only for now). The `moduleVideo` file
   uploads could move there later; live streaming stays on Mux
   ([live-streaming.md](./live-streaming.md)).

## Rules that keep Path B → Path A cheap

- Alt text stays a translated field on the image object, never asset metadata.
- Tags are editorial organization only; nothing in `web/` should ever filter or branch on them
  (so dropping `opt.media.tags` for aspects costs nothing).
- Never store a CDN URL in a document — always `asset._ref` (already the rule).
- Keep `useSanityImage` building URLs from the ref; don't switch to Container URLs.

## Open questions for the client

1. Is Enterprise on the table? If not, Path A is moot and Path B is the plan.
2. Who owns asset hygiene (tagging, deleting unused uploads)? The plugin's "unused" facet makes
   this a monthly five-minute job.
3. Do photographers need credit lines or license expiry tracking? That decides whether we enable
   `creditLine` now or wait for aspects.

## Sources

- [Media Library docs](https://www.sanity.io/docs/media-library) ·
  [Configure your studios and CLI](https://www.sanity.io/docs/media-library/configure-library) ·
  [Link assets to documents](https://www.sanity.io/docs/media-library/link-media-assets) ·
  [Query aspects](https://www.sanity.io/docs/media-library/query-aspects) ·
  [Create an aspect](https://www.sanity.io/docs/media-library/create-aspect) ·
  [Asset visibility](https://www.sanity.io/docs/media-library/asset-visibility) ·
  [Container URLs](https://www.sanity.io/docs/media-library/container-urls) ·
  [Migrate from the Media plugin](https://www.sanity.io/docs/media-library/media-migration)
- [Sanity pricing](https://www.sanity.io/pricing) — Media Library listed as an Enterprise add-on
- [sanity-plugin-media](https://www.sanity.io/plugins/sanity-plugin-media) ·
  [npm](https://www.npmjs.com/package/sanity-plugin-media)
- [Recipe: auto-generate alt text for Media Library assets](https://www.sanity.io/recipes/auto-generate-alt-text-for-media-library-assets-53d0069d)
  (the aspect-based alt pattern this plan deliberately does not adopt)

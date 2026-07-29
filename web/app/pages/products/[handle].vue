<template>
  <div class="pdp px-base flex-1 flex flex-col">
    <div class="pdp-content grid md:grid-cols-2 flex-1 overflow-hidden enter-in-fade-up">
      <div class="media h-full bg-grey-2"></div>

      <div class="details px-base">
        <h1 class="uppercase text-lg text-center leading-none py-28">{{ live?.title || doc.title }}</h1>

        <!-- ClientOnly: the buy box is the geo-varying client island. Its
             pending state only exists client-side, so rendering it during SSR
             causes hydration mismatches. The slot wrapper reserves the box's
             space so content below doesn't jump when live data arrives. -->
        <div class="buy-box-slot">
          <ClientOnly>
            <ProductBuyBox
              :live="live"
              :pending="livePending"
            />

            <template #fallback>
              <p class="text-xs uppercase buy-box-fallback">{{ $t('buyBox.loading') }}</p>
            </template>
          </ClientOnly>
        </div>

        <ProductColorwaysRail :items="colorways" />

        <SanityContent
          v-if="doc.body?.length"
          :blocks="doc.body"
          class="body-content"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { productPageQuery, colorwaysQuery } from '~/utils/queries'

// Handle is reactive so colorway navigation (same route component, new param)
// re-fetches data IN PLACE. No page `key`/remount — the shell, rail, and buy
// box persist and only the changed data updates, which avoids the full-page
// flash on colorway switches.
const route = useRoute()
const handle = computed(() => String(route.params.handle))
const sanity = useSanity()
const market = useMarket()

// SSR shell (cached per locale URL): Sanity editorial + synced identity.
// $lang resolves the translated tagline/body; watched so an in-place language
// switch (same route component, new prefix) refetches.
const { data: doc } = await useAsyncData(
  // Handle+lang key: each product/language caches separately, and the key
  // changing on navigation triggers a fresh fetch (a static key would serve
  // the previous product's cached payload).
  () => `pdp-doc-${handle.value}-${market.value.lang}`,
  () => sanity.fetch(productPageQuery, { handle: handle.value, lang: market.value.lang }),
  { watch: [() => market.value.lang] },
)

// Initial / SSR miss.
if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}
// Client-side navigation to an unknown handle — setup won't re-run, so guard
// reactively once the in-place refetch resolves to nothing.
watch(doc, (value) => {
  if (!value) showError({ statusCode: 404, statusMessage: 'Product not found' })
})

// Colorway siblings via the shared group:<slug> Shopify tag. Empty tag matches
// nothing (safe for ungrouped products). Watches handle so the current product
// is excluded from its own rail after an in-place switch.
const groupTag = computed(() => (doc.value?.tags ?? '').split(', ').find((t) => t.startsWith('group:')) ?? '')
const { data: colorwayDocs } = await useAsyncData(
  () => `pdp-colorways-${handle.value}`,
  () => sanity.fetch(colorwaysQuery, { groupTag: groupTag.value, handle: handle.value }),
  // groupTag resolves from doc a tick after handle changes; watch it so the
  // rail refetches once the new product's group is known.
  { watch: [groupTag] },
)

// The buy-box island: live market-priced data, client-side only. useFetch keeps
// the previous product's data during the refetch, so the box updates rather
// than collapsing to a loading state.
const { data: liveData, pending: livePending, refresh: refreshLive } = useShopifyProduct(handle)
const live = computed(() => liveData.value?.product ?? null)

// A back-nav remount serves this useFetch from Nuxt's payload cache — instant
// paint, but session-stale. Revalidate in the background so availability here
// is never staler than the server cache's ~60s window. Skip when there's no
// cached data: the initial fetch is already in flight.
onMounted(() => {
  if (liveData.value) refreshLive()
})

// Report what this page learned to the shared catalog, so listing surfaces
// stay consistent with what the visitor just saw here. A loaded-but-null
// product is real info (masked from this market) — the response can't name
// its gid, but the Sanity doc can.
const { report, byGid: catalog } = useLiveCatalog()
watch(liveData, (val) => {
  if (!val) return
  if (val.product?.id) report(val.product.id, val.product, val.country)
  else if (doc.value?.gid) report(doc.value.gid, null, val.country)
})

// Live thumbs/availability for the rail: fetched via the lean batch route,
// rendered from the catalog so revisits paint the last known data instantly.
const colorwayGids = computed(() => (colorwayDocs.value ?? []).map((d) => d.gid).filter(Boolean))
useShopifyProducts(colorwayGids)

const colorways = computed(() =>
  (colorwayDocs.value ?? []).map((d) => ({
    doc: d,
    live: catalog.value[d.gid] ?? null,
  })),
)

useHead({
  title: () => `${doc.value?.title ?? 'Product'} — Balun`,
  bodyAttrs: { class: 'template-pdp' },
})
</script>

<style scoped>
.pdp {
  padding-top: calc(var(--spacing-button-lg-height) + var(--spacing-base) * 2);
  padding-bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
}

.pdp-content {
  background-color: var(--color-white);
  border-radius: var(--radius-def);
}

.media {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  color: var(--color-grey-1);

  .buy-box-fallback {
    color: var(--color-grey-6);
  }

  /* Reserve the buy box's approximate height (price + size pills + button)
     so the client island loading in doesn't shift the colorways rail and
     body content below it. */
  .buy-box-slot {
    min-height: 24rem;
  }

  .body-content {
    color: var(--color-grey-4);
  }
}
</style>

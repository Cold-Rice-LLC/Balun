<template>
  <div class="pdp px-base">
    <div class="grid md:grid-cols-2 gap-base">
      <div class="media">
        <template v-if="live?.images.nodes.length">
          <div
            v-for="image in live.images.nodes"
            :key="image.url"
            class="image-frame"
          >
            <img
              :src="image.url"
              :alt="image.altText || doc.title"
            />
          </div>
        </template>

        <div
          v-else
          class="image-frame"
        ></div>
      </div>

      <div class="details">
        <h1 class="uppercase text-lg leading-none">{{ live?.title || doc.title }}</h1>

        <p
          v-if="doc.tagline"
          class="tagline text-xs uppercase"
        >
          {{ doc.tagline }}
        </p>

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
              <p class="text-xs uppercase buy-box-fallback">Loading price…</p>
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

// SSR shell (cached per locale URL): Sanity editorial + synced identity.
const { data: doc } = await useAsyncData(
  // Handle-specific key: each product caches separately, and the key changing
  // on navigation triggers a fresh fetch (a static key would serve the
  // previous product's cached payload).
  () => `pdp-doc-${handle.value}`,
  () => sanity.fetch(productPageQuery, { handle: handle.value }),
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
const groupTag = computed(
  () => (doc.value?.tags ?? '').split(', ').find((t) => t.startsWith('group:')) ?? '',
)
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
const { data: liveData, pending: livePending } = useShopifyProduct(handle)
const live = computed(() => liveData.value?.product ?? null)

// Live thumbs/availability for the rail (lean batch route).
const colorwayGids = computed(() => (colorwayDocs.value ?? []).map((d) => d.gid).filter(Boolean))
const { data: colorwayLive } = useShopifyProducts(colorwayGids)

const colorways = computed(() =>
  (colorwayDocs.value ?? []).map((d) => ({
    doc: d,
    live: colorwayLive.value?.products?.find((p) => p?.id === d.gid) ?? null,
  })),
)

useHead({ title: () => `${doc.value?.title ?? 'Product'} — Balun` })
</script>

<style scoped>
.pdp {
  padding-top: calc(var(--spacing-button-lg-height) + var(--spacing-base) * 2);
  padding-bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
}

.media {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.image-frame {
  aspect-ratio: 3 / 4;
  background-color: var(--color-grey-7);
  border-radius: var(--radius-def);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  color: var(--color-grey-1);

  .tagline {
    color: var(--color-grey-4);
  }

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

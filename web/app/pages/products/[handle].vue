<template>
  <div class="pdp px-base flex-1 flex flex-col">
    <div class="pdp-content flex flex-1 enter-in-fade-up">
      <div class="media-col">
        <!-- Draggable lifestyle gallery (no arrows — dots only), pinned
             while the details column scrolls. -->
        <div class="media">
          <Swiper
            v-if="doc.gallery?.length"
            class="media-slides"
            :modules="[Pagination]"
            :slides-per-view="1"
            :loop="true"
            :grab-cursor="true"
          >
            <SwiperSlide
              v-for="(image, i) in doc.gallery"
              :key="i"
              class="media-slide"
            >
              <img
                :src="urlFor(image, { w: 1400 })"
                :alt="live?.title || doc.title"
                class="media-cover"
              />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      <div class="details">
        <header class="pdp-header text-center px-base">
          <h1 class="uppercase text-lg leading-none">{{ live?.title || doc.title }}</h1>

          <!-- Live price is the geo-varying client island; SSR renders the
               placeholder line so nothing shifts when it arrives. -->
          <ClientOnly>
            <p class="price font-secondary">
              <template v-if="live">
                {{ formatMoney(selectedVariant?.price ?? live.priceRange.minVariantPrice) }}
                <s
                  v-if="compareAt"
                  class="compare-at"
                  >{{ compareAt }}</s
                >
                <span
                  v-if="!live.availableForSale"
                  class="sold-out uppercase"
                  >{{ $t('buyBox.soldOut') }}</span
                >
              </template>
              <template v-else-if="!livePending">{{ $t('buyBox.unavailable') }}</template>
              <template v-else>&nbsp;</template>
            </p>

            <template #fallback>
              <p class="price font-secondary">&nbsp;</p>
            </template>
          </ClientOnly>
        </header>

        <div class="carousel-region">
          <ProductFeatureCarousel
            :slides="doc.featureCarousel ?? []"
            :alt="live?.title || doc.title"
          />
        </div>

        <p
          v-if="doc.tagline"
          class="tagline font-secondary uppercase text-center"
        >
          {{ doc.tagline }}
        </p>

        <!-- Sticky purchase row: pinned above the bottom nav while the
             column scrolls. The button opens the shared quick-add drawer
             (sizes/quantity/add live there); colorway switching stays on the
             page, above the button, so siblings are one click with no drawer
             in between. -->
        <div class="buy-row font-secondary px-base">
          <div class="buy-col flex flex-col justify-end gap-base">
            <ProductColorwaysRail :items="colorways" />

            <ClientOnly>
              <button
                class="open-options text-base-plus font-primary"
                :disabled="!live || !live.availableForSale"
                aria-haspopup="dialog"
                aria-controls="quick-add-drawer"
                @click="openQuickAdd({ doc, live, learnMore: false, backdrop: false })"
              >
                {{ buyLabel }}
              </button>

              <template #fallback>
                <button
                  class="open-options text-base-plus font-primary"
                  disabled
                >
                  {{ $t('buyBox.loading') }}
                </button>
              </template>
            </ClientOnly>
          </div>

          <div class="flex flex-col gap-sm">
            <div
              v-if="doc.body?.length"
              class="description text-sm rich-text"
            >
              <SanityContent :value="doc.body" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { productPageQuery, colorwaysQuery } from '~/utils/queries'

// Handle is reactive so colorway navigation (same route component, new param)
// re-fetches data IN PLACE. No page `key`/remount — the shell, carousels, and
// buy row persist and only the changed data updates, which avoids the
// full-page flash on colorway switches.
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const handle = computed(() => String(route.params.handle))
const sanity = useSanity()
const market = useMarket()
const urlFor = useSanityImage()

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

// The colorway group (current product INCLUDED — the rail marks it) via the
// shared group:<slug> Shopify tag. Empty tag matches nothing (safe for
// ungrouped products). Keyed by GROUP, not handle: switching to a sibling
// serves the same cached member list and only the current marker moves.
const groupTag = computed(() => (doc.value?.tags ?? '').split(', ').find((t) => t.startsWith('group:')) ?? '')
const { data: colorwayDocs } = await useAsyncData(
  () => `pdp-colorways-${groupTag.value}`,
  () => sanity.fetch(colorwaysQuery, { groupTag: groupTag.value }),
  // groupTag resolves from doc a tick after handle changes; watch it so the
  // rail refetches once a NEW group is known (cross-group navigation).
  { watch: [groupTag] },
)

// Live market-priced data, client-side only. useFetch keeps the previous
// product's data during the refetch, so the buy row updates rather than
// collapsing to a loading state.
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
    current: d.slug === handle.value,
  })),
)

const variants = computed(() => live.value?.variants.nodes ?? [])

// Shopify variant GIDs are gid://shopify/ProductVariant/<numericId>; the URL
// carries just the numeric id (Shopify's ?variant= convention) so links are
// clean and shareable.
const variantNumericId = (gid) => gid.split('/').pop()

// Selection lives in the URL (?variant=) so a picked size is shareable and
// survives reload; the options panel drives it through this model. Replace,
// not push — size taps shouldn't stack history entries.
const selectedVariantId = computed({
  get: () => {
    const fromUrl = route.query.variant
    if (!fromUrl) return null
    return variants.value.find((v) => variantNumericId(v.id) === String(fromUrl))?.id ?? null
  },
  set: (id) => {
    const query = { ...route.query }
    if (id) query.variant = variantNumericId(id)
    else delete query.variant
    router.replace({ query })
  },
})

const selectedVariant = computed(() => pickVariant(variants.value, selectedVariantId.value))

const compareAt = computed(() => {
  const price = selectedVariant.value?.compareAtPrice
  return price && Number(price.amount) > 0 ? formatMoney(price) : null
})

// The main button only OPENS the shared quick-add drawer — the add itself
// happens on the drawer's panel (its state machine owns adding/added/failed).
const { open: openQuickAdd } = useQuickAdd()

const buyLabel = computed(() => {
  if (!live.value) return livePending.value ? t('buyBox.loading') : t('buyBox.unavailable')
  if (!live.value.availableForSale) return t('buyBox.soldOut')
  return t('buyBox.addToCart')
})

useHead({
  title: () => `${doc.value?.title ?? 'Product'} — Balun`,
  bodyAttrs: { class: 'template-pdp' },
})
</script>

<style scoped>
.pdp {
  padding-top: var(--spacing-page-top);
}

.media {
  position: sticky;
  top: 0px;
  height: 100svh;
  border-top-left-radius: var(--radius-def);
  border-bottom-left-radius: var(--radius-def);
  overflow: hidden;
  background-color: var(--color-grey-2);
}

.media-col {
  width: calc(50% - 1rem);
  flex: none;
}

.media-slides {
  width: 100%;
  height: 100%;
}

.media-slide img {
  display: block;
}

/* Swiper renders the bullets into this SIBLING of the swiper (pagination.el),
   so they're positioned against the panel rather than inside the swiper's
   own context. The stuck panel's bottom edge is the viewport bottom, so the
   inset clears the fixed shop button (top edge = button-lg-height from the
   bottom) plus a spacing-base gap. */
.media-dots {
  position: absolute;
  z-index: 2;
  bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  left: 0;
  width: 100%;
  text-align: center;
}

.media :deep(.swiper-pagination-bullet) {
  background-color: var(--color-white);
  opacity: 0.5;
}

.media :deep(.swiper-pagination-bullet-active) {
  opacity: 1;
}

.details {
  /* Takes the row's leftover beside the fixed-width media column. min-width 0
     because a flex item defaults to min-width:auto, which refuses to shrink
     below its content — that's what lets a wide child push this column past
     its share instead of wrapping inside it. */
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  color: var(--color-grey-3);
  background-color: var(--color-white);
  /* Bottom out the sticky buy row on short content: the column always
     spans at least the visible panel height. */
  min-height: calc(100svh - var(--spacing-page-top) - var(--spacing-button-lg-height) - var(--spacing-base));
  border-top-right-radius: var(--radius-def);
  border-bottom-right-radius: var(--radius-def);
}

.pdp-header {
  padding-top: 4.5rem;
  padding-bottom: 2rem;
}

.price {
  margin-top: var(--spacing-sm);
  color: var(--color-grey-7);

  .compare-at {
    color: var(--color-grey-4);
    margin-left: var(--spacing-xs);
  }

  .sold-out {
    color: var(--color-orange);
    margin-left: var(--spacing-xs);
  }
}

/* A FIXED height, not flex-1 — in an unconstrained column, flex leftover is
   just the content's own size and the shared carousel's frames would never
   cap (same trap as the featured module's min-height). */
.carousel-region {
  height: 32svh;
  /* Narrower arrows than the home module's — this carousel sits in a half
     -width column, so the full-size ones eat too much of the image. */
  --carousel-arrow-width: 3.4rem;
}

.carousel-region :deep(.highlight) {
  font-size: 0.8rem;
}

.tagline {
  color: var(--color-grey-4);
}

.buy-row {
  z-index: 10;
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-base);
  align-items: end;
  padding-block: var(--spacing-base);
}

/* Sticky as a UNIT (rail + button) within the tall grid area the description
   creates — sticky on the button alone would clamp to the area's top while
   the row is below the fold and ride up over the rail. */
.buy-col {
  position: sticky;
  bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
}

.open-options {
  height: var(--spacing-button-lg-height);
  width: 100%;
  border-radius: var(--radius-def);
  background-color: var(--color-grey-7);
  color: var(--color-white);
  transition:
    background-color 0.3s,
    color 0.3s;

  &:hover:enabled {
    background-color: var(--color-yellow);
    color: var(--color-green);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.description {
  color: var(--color-grey-6);
}

@media (max-width: 768px) {
  .media {
    position: static;
    height: 50svh;
    border-top-right-radius: var(--radius-def);
    border-bottom-left-radius: 0;
  }

  /* Static media here — its bottom edge is nowhere near the fixed nav, so
     the dots go back to hugging the panel. */
  .media-dots {
    bottom: var(--spacing-base);
  }

  .buy-row {
    grid-template-columns: 1fr;
  }
}
</style>

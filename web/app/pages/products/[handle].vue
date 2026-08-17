<template>
  <div
    class="pdp px-base flex-1 flex flex-col"
    :class="{ 'is-switching': switching }"
  >
    <div class="pdp-content flex flex-1 enter-in-fade-up">
      <div class="media-col">
        <!-- Draggable lifestyle gallery (no arrows — dots only), pinned
             while the details column scrolls. Keyed by product so a colorway
             switch remounts the swiper (fresh slides, back to slide one) and
             the new gallery animates in. -->
        <div class="media">
          <Transition
            name="colorway"
            mode="out-in"
          >
            <Swiper
              v-if="doc.gallery?.length"
              :key="doc.gid"
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
                  :alt="liveForDoc?.title || doc.title"
                  class="media-cover"
                />
              </SwiperSlide>
            </Swiper>
          </Transition>
        </div>
      </div>

      <!-- Keyed like the gallery: the whole column (title, carousel, buy
           row, description) re-enters when a new colorway's doc lands. -->
      <Transition
        name="colorway"
        mode="out-in"
      >
        <div
          :key="doc.gid"
          class="details"
          :class="{ 'no-description': !doc.body?.length }"
        >
          <header class="pdp-header text-center px-base">
            <h1 class="uppercase text-lg leading-none">{{ liveForDoc?.title || doc.title }}</h1>

            <!-- Live price is the geo-varying client island; SSR renders the
                 placeholder line so nothing shifts when it arrives. -->
            <ClientOnly>
              <p class="price font-secondary">
                <template v-if="liveForDoc">
                  {{ formatMoney(selectedVariant?.price ?? liveForDoc.priceRange.minVariantPrice) }}
                  <s
                    v-if="compareAt"
                    class="compare-at"
                    >{{ compareAt }}</s
                  >
                  <span
                    v-if="!liveForDoc.availableForSale"
                    class="sold-out uppercase"
                    >{{ $t('buyBox.soldOut') }}</span
                  >
                </template>
                <template v-else-if="!livePending && !switching">{{ $t('buyBox.unavailable') }}</template>
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
              :alt="liveForDoc?.title || doc.title"
            />
          </div>

          <p
            v-if="doc.tagline"
            class="tagline font-secondary uppercase text-center"
          >
            {{ doc.tagline }}
          </p>

          <!-- Sticky purchase row: pinned above the bottom nav while the
               column scrolls. The buy panel owns the whole flow in place —
               "purchase" expands it into sizes, the colorway rail, quantity,
               and add to cart. -->
          <div class="buy-row font-secondary px-base">
            <div class="buy-col">
              <div class="buy-col-inner">
                <ProductBuyPanel
                  v-model:variant-id="selectedVariantId"
                  :live="liveForDoc"
                  :live-pending="livePending || switching"
                  :colorways="colorways"
                  @add-failed="refreshLive"
                />
              </div>
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
      </Transition>
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
// re-fetches data IN PLACE — the shell and buy row persist and only the
// changed data updates (the keyed Transitions above animate it in), which
// avoids the full-page flash on colorway switches. The static key opts out of
// Nuxt's default route key, which interpolates the path and would remount the
// page on every handle change.
definePageMeta({ key: 'products-handle' })
const route = useRoute()
const router = useRouter()
const handle = computed(() => String(route.params.handle))
const sanity = useSanity()
const market = useMarket()
const urlFor = useSanityImage()

// SSR shell (cached per locale URL): Sanity editorial + synced identity.
// $lang resolves the translated tagline/body; watched so an in-place language
// switch (same route component, new prefix) refetches.
const { data: doc, status: docStatus } = await useAsyncData(
  // Handle+lang key: each product/language caches separately, and the key
  // changing on navigation triggers a fresh fetch (a static key would serve
  // the previous product's cached payload).
  () => `pdp-doc-${handle.value}-${market.value.lang}`,
  () => sanity.fetch(productPageQuery, { handle: handle.value, lang: market.value.lang }),
  { watch: [() => market.value.lang] },
)

// An in-place switch is loading the next product's doc — the page shows a
// busy cursor meanwhile. Never pending on first paint: setup awaits the
// initial fetch before rendering.
const switching = computed(() => docStatus.value === 'pending')

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

// `live` outlives `doc` during an in-place switch (useFetch keeps the
// previous response, and either fetch can land first) — pair them only when
// they describe the same product, so the outgoing content can't preview the
// next colorway's title/price before the swap animates in.
const liveForDoc = computed(() => (live.value?.id === doc.value?.gid ? live.value : null))

// A back-nav remount serves this useFetch from Nuxt's payload cache — instant
// paint, but session-stale. Revalidate in the background so availability here
// is never staler than the server cache's ~15s window. Skip when there's no
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

const variants = computed(() => liveForDoc.value?.variants.nodes ?? [])

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

useHead({
  title: () => `${doc.value?.title ?? 'Product'} — Balun`,
  bodyAttrs: { class: 'template-pdp' },
})
</script>

<style scoped>
.pdp {
  padding-top: var(--spacing-page-top);
}

/* An in-place product switch (colorway hop) is loading the next doc — show
   busy everywhere until it lands; the * covers buttons and links, whose own
   cursor rules would win otherwise. */
.pdp.is-switching,
.pdp.is-switching * {
  cursor: progress;
}

/* Static half-height panel on mobile; from 768px up it pins sticky beside
   the scrolling details column, radii moving to the left edge. */
.media {
  position: static;
  height: 50svh;
  border-top-left-radius: var(--radius-def);
  border-top-right-radius: var(--radius-def);
  overflow: hidden;

  @media (min-width: 768px) {
    position: sticky;
    top: 0;
    height: 100svh;
    border-top-right-radius: 0;
    border-bottom-left-radius: var(--radius-def);
  }
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
/* Hug the panel on mobile (static media — its bottom edge is nowhere near
   the fixed nav); clear the nav from 768px up, where the media is viewport
   height. */
.media-dots {
  position: absolute;
  z-index: 2;
  bottom: var(--spacing-base);
  left: 0;
  width: 100%;
  text-align: center;

  @media (min-width: 768px) {
    bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  }
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
  /* Grow, not margin-top:auto — the leftover height (the details column is
     stretched to the 100svh media at minimum) becomes the grid row's, so the
     sticky buy-col always has room to pin in view even with no description. */
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-base);
  align-items: start;
  padding-block: var(--spacing-base);

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
}

/* No description = no tall grid area for the sticky buy-col to travel in, so
   in-flow it would rest at the column's bottom edge — which sits page-top
   below the fold (the column stretches to the 100svh media). Cap the column
   (the natural height is content-driven, so a bottom reserve would otherwise
   just grow it) and reserve the overhang plus the fixed bar's height below
   the row (the bar's base-gap clearance cancels against the row's own
   padding-bottom): the buy panel then rests exactly where the sticky
   would pin it, with the carousel shrinking below 32svh to make the room
   on shorter viewports. */
.details.no-description {
  max-height: 100svh;
}

.details.no-description .buy-row {
  margin-bottom: calc(var(--spacing-page-top) + var(--spacing-button-lg-height));
}

/* The flex minimum of the fixed-height region is its specified 32svh, which
   would win over the cap and push the reserve below the fold invisibly —
   zero it so the region actually yields. */
.details.no-description .carousel-region {
  min-height: 0;
}

/* Sticky within the tall grid area, pinned above the bottom nav — the buy
   panel expands upward from here. */
.buy-col {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  .buy-col-inner {
    position: sticky;
    bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  }
}

.description {
  color: var(--color-grey-6);
}

/* The colorway swap: outgoing content slips away, then the incoming gallery
   and details column enter in the house fade-up motion (the keyed
   Transitions fire when the new doc lands). */
.colorway-enter-active {
  transition:
    opacity 0.6s var(--curve),
    transform 0.6s var(--curve);
}

.colorway-enter-from {
  opacity: 0;
  transform: translateY(5rem);
}

.colorway-leave-active {
  transition: opacity 0.2s;
}

.colorway-leave-to {
  opacity: 0;
}
</style>

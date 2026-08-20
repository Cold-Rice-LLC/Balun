<template>
  <NotchPanel
    class="feed-card tab-top-max-md"
    :class="[`cat-${post.category}`, { 'has-cover': !!post.coverImage }]"
  >
    <img
      v-if="post.coverImage"
      :src="urlFor(post.coverImage, { w: 2000 })"
      alt=""
      class="cover"
      loading="lazy"
    />

    <div class="head uppercase leading-none">
      <p>{{ formatDate(post.publishedAt) }}</p>
      <h2>{{ cardTitle }}</h2>

      <div class="mt-12 flex items-end gap-base">
        <a
          v-if="post.category === 'events' && post.link"
          class="rsvp text-lg bg-black text-grey-1 rounded-lg leading-none px-4 py-2 uppercase"
          :href="post.link"
          target="_blank"
          rel="noopener"
        >
          {{ $t('feed.rsvp') }}
        </a>

        <p
          v-if="showExcerpt"
          class="excerpt font-secondary text-base normal-case"
        >
          {{ post.excerpt }}
        </p>
      </div>
    </div>

    <span
      v-if="post.category === 'stream'"
      class="watch text-lg bg-black text-grey-1 rounded-lg leading-none px-4 py-2 uppercase"
      aria-hidden="true"
    >
      <IconsPlay />

      <span>{{ $t('feed.watch') }}</span>
    </span>

    <!-- Whole-card link; after .head in the DOM so it paints (and clicks)
         above the text at the same z-index. The RSVP link stacks above it. -->
    <NuxtLink
      class="card-link"
      :to="destination"
      :aria-label="cardTitle"
    />

    <!-- In the tab slot so the body's overflow clip can't cut them off: the
         row hugs the nipple's outer edge and runs back in over the card.
         Display only — clicks fall through to the card link. -->
    <template #tab>
      <div class="chips font-tertiary text-xs">
        <span
          v-if="post.category === 'stream' && isLive"
          class="chip"
        >
          {{ $t('feed.live') }}
        </span>
        <span class="chip">{{ $t(`feed.categories.${post.category}`) }}</span>
      </div>
    </template>
  </NotchPanel>
</template>

<script setup>
/**
 * A post card on the Feed landing: a NotchPanel with a small fixed nipple
 * poking out past the top-right corner (off the right edge; above it under
 * 768px, quick-add style), always in the category color — over a cover
 * image, a corner gradient fades that color into the photo so the nipple
 * blends in. The category chip (plus a "live" chip while the live page
 * toggle is on) anchors top-right and shifts out over the nipple. Cover
 * image full-bleed in the body when set; category fallback colors otherwise
 * (events yellow/black, blog grey-7/grey-1, products grey-1/grey-7, stream
 * purple/white). Date + title top-left (streams say "live stream" instead
 * of their title), events show the excerpt and an RSVP link, blog shows the
 * excerpt, streams get a watch affordance.
 *
 * The card links to its detail page — except a stream while live, which
 * links to /live.
 */
const props = defineProps({
  post: { type: Object, required: true },
  isLive: { type: Boolean, default: false },
})

const urlFor = useSanityImage()
const localePath = useLocalePath()

const { t } = useI18n()
const cardTitle = computed(() => (props.post.category === 'stream' ? t('feed.liveStream') : props.post.title))

const destination = computed(() =>
  props.post.category === 'stream' && props.isLive ? localePath('/live') : localePath(`/feed/${props.post.slug}`),
)

const showExcerpt = computed(() => ['events', 'blog'].includes(props.post.category) && props.post.excerpt)

// Numeric mm.dd.yyyy per the card mockups — the same in every language.
const formatDate = (iso) => {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${d.getFullYear()}`
}
</script>

<style scoped>
/* Every card's nipple is the same fixed 5rem square. */
.feed-card {
  --notch-tab-size: 5rem;
}

.feed-card :deep(.panel-tab) {
  width: var(--notch-tab-size);
  height: var(--notch-tab-size);
}

/* Body + tab share the category color via NotchPanel's --notch-bg; the text
   color rides along and also styles the chip/RSVP outlines. */
.cat-events {
  --notch-bg: var(--color-yellow);

  color: var(--color-black);
}

.cat-blog {
  --notch-bg: var(--color-grey-7);

  color: var(--color-grey-1);
}

.cat-products {
  --notch-bg: var(--color-grey-1);

  color: var(--color-grey-7);
}

.cat-stream {
  --notch-bg: var(--color-purple);

  color: var(--color-white);
}

.feed-card :deep(.panel-body) {
  position: relative;
  padding: var(--spacing-base);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
}

/* Only covers hold the card open to the big media ratio — solid cards hug
   their content. */
.feed-card.has-cover :deep(.panel-body) {
  aspect-ratio: 4 / 5;

  @media (min-width: 768px) {
    aspect-ratio: 2 / 1;
  }
}

/* Over a photo the category text color can't be trusted to read — white
   text instead. The chips stay category-colored: they sit on the corner
   blend. */
.feed-card.has-cover .head {
  color: var(--color-white);
}

/* Two jobs, one ::after (tree order paints it over the cover img; the text
   layers carry z-index to sit back above it): the corner wash that fades
   the nipple's category color into the photo so the nipple blends in, and
   under it the top scrim that keeps the white text legible. */
.feed-card.has-cover :deep(.panel-body)::after {
  content: '';
  position: absolute;
  inset: 0;
  /* Both fades follow a smoothstep curve (flat at both ends) — any straight
     ramp ends in a visible Mach-band line where it hits zero. The wash's
     ellipse is sized past the card's far corner (145% > sqrt(2)), so its
     endpoint never lands on the canvas at all: the visible fade happens in
     the first ~40%, and the sub-1% tail crawls to zero off-card. */
  background:
    radial-gradient(
      ellipse 145% 145% at 100% 0,
      var(--notch-bg) 3%,
      color-mix(in srgb, var(--notch-bg) 97%, transparent) 8%,
      color-mix(in srgb, var(--notch-bg) 90%, transparent) 12%,
      color-mix(in srgb, var(--notch-bg) 81%, transparent) 16%,
      color-mix(in srgb, var(--notch-bg) 70%, transparent) 20%,
      color-mix(in srgb, var(--notch-bg) 58%, transparent) 24%,
      color-mix(in srgb, var(--notch-bg) 46%, transparent) 28%,
      color-mix(in srgb, var(--notch-bg) 34%, transparent) 32%,
      color-mix(in srgb, var(--notch-bg) 23%, transparent) 36%,
      color-mix(in srgb, var(--notch-bg) 14%, transparent) 40%,
      color-mix(in srgb, var(--notch-bg) 7%, transparent) 44%,
      color-mix(in srgb, var(--notch-bg) 3%, transparent) 48%,
      color-mix(in srgb, var(--notch-bg) 1%, transparent) 54%,
      color-mix(in srgb, var(--notch-bg) 0.3%, transparent) 62%,
      transparent 85%
    ),
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.45),
      rgba(0, 0, 0, 0.42) 12%,
      rgba(0, 0, 0, 0.34) 25%,
      rgba(0, 0, 0, 0.24) 38%,
      rgba(0, 0, 0, 0.13) 50%,
      rgba(0, 0, 0, 0.05) 58%,
      rgba(0, 0, 0, 0.01) 65%,
      transparent 70%
    );
}

.cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-link {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.head {
  position: relative;
  z-index: 1;
  font-size: var(--text-lg);

  @media (min-width: 768px) {
    font-size: var(--text-xl);
  }
}

.excerpt {
  max-width: 44rem;
  line-height: 1.1;
}

.watch {
  width: auto;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.watch :deep(.icon-play) {
  width: 1em;
  flex: none;
}

/* From 768px: anchored to the nipple's outer edge, running back in over
   the card's corner, where the blend (or the card's own color) backs the
   row (the tab never clips, unlike the body). On mobile the nipple sits
   above the card and its left flank is bare page — black-on-black for some
   categories — so the row tucks just inside the card's top edge instead.
   Display only — clicks pass through to the card link below. */
.chips {
  position: absolute;
  top: 100%;
  right: 15px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: var(--notch-tab-size);
  pointer-events: none;

  @media (min-width: 768px) {
    top: 0;
  }
}

.chip {
  border: 1px solid currentColor;
  border-radius: 2rem;
  padding: 0.2rem 1.2rem;
}
</style>

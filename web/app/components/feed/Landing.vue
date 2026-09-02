<template>
  <div class="feed-page px-base enter-in-fade-up">
    <!-- Shoe outlines overlaid on the content block, same treatment as the
         info page but with the second outline set: absolute over the page's
         full box so it scrolls along, slice = background-size: cover. -->
    <div
      class="shoe-overlay"
      aria-hidden="true"
    >
      <IconsShoeOutlines2 preserveAspectRatio="xMidYMid slice" />
    </div>

    <!-- Filters stay up whenever a filter is active, even over zero results —
         otherwise there'd be no way to clear it. -->
    <template v-if="posts.length || filter">
      <!-- Single-select category filter, mirrored into ?filter= so filtered
           views are shareable URLs. Clicking the active pill clears it. -->
      <nav
        class="filters font-tertiary text-xs"
        :aria-label="$t('feed.filterPosts')"
      >
        <span>{{ $t('feed.filter') }}</span>

        <button
          v-for="cat in FEED_CATEGORIES"
          :key="cat"
          class="filter-pill"
          :class="{ active: filter === cat }"
          :aria-pressed="filter === cat"
          @click="toggleFilter(cat)"
        >
          {{ $t(`feed.categories.${cat}`) }}
        </button>
      </nav>

      <ul
        v-if="posts.length"
        :key="listKey"
        class="posts space-y-base"
        :class="{ 'enter-in-fade-up': listKey > 0 }"
      >
        <li
          v-for="post in posts"
          :key="post._id"
        >
          <FeedCard
            :post="post"
            :is-live="feed?.isLive"
          />
        </li>
      </ul>

      <p
        v-else
        class="feed-empty font-quaternary text-xs"
      >
        {{ $t('feed.empty') }}
      </p>

      <button
        v-if="hasMore"
        class="load-more filter-pill font-tertiary text-xs"
        :disabled="loadingMore"
        @click="$emit('loadMore')"
      >
        {{ $t('feed.loadMore') }}
      </button>
    </template>

    <div
      v-else
      class="stub h-svh flex justify-center items-center"
    >
      <h1>Feed</h1>
    </div>
  </div>
</template>

<script setup>
/**
 * The Feed landing: filter row, the post cards loaded so far, and the load
 * more button. Rendered by the feed route (pages/feed.vue), which owns the
 * data and stays mounted under the detail modal — that's what keeps
 * someone's place (loaded pages, filter, scroll) when they open and close
 * a post.
 */
const props = defineProps({
  feed: { type: Object, default: null },
  filter: { type: String, default: null },
  posts: { type: Array, required: true },
  hasMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
})
defineEmits(['loadMore'])

// A filter (or language) change swaps the base fetch: the new list fades in
// (a fresh keyed element replays the enter animation). Load more just
// appends. The first render skips the animation — the page as a whole
// already enters.
const listKey = ref(0)
watch(
  () => props.feed,
  () => {
    listKey.value += 1
  },
)

// replace, not push: pill toggles shouldn't stack up in browser history.
const route = useRoute()
const router = useRouter()
const toggleFilter = (cat) => {
  router.replace({
    query: { ...route.query, filter: props.filter === cat ? undefined : cat },
  })
}
</script>

<style scoped>
/* Constant geometry so filtering can't move it: scale comes from the page
   WIDTH (via the drawing's natural aspect), anchored top — unlike inset:0 +
   slice, the box never re-solves when the post list changes the page height.
   The page's overflow clip just reveals less of it on shorter views. */
.shoe-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  aspect-ratio: 1911 / 3336;
  z-index: 20;
  /* Decor only — clicks and scroll pass through to the page. */
  pointer-events: none;
  opacity: 0.7;
}

/* Child component root node, so plain scoped descendant selection reaches it. */
.shoe-overlay .icon-shoe-outlines-2 {
  display: block;
  width: 100%;
  height: 100%;
}

/* 12-col grid like the info page; the filter row and post list sit in the
   center 6 columns. relative anchors the absolute shoe overlay. */
.feed-page {
  position: relative;
  /* Clips the fixed-scale shoe overlay on views shorter than the drawing. */
  overflow: clip;
  padding: 14rem var(--spacing-base);
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: var(--spacing-base);
  row-gap: var(--spacing-base);
  align-items: start;
  align-content: start;
  min-height: 100svh;
}

/* Filters, posts, and the empty note share the column: full width on
   mobile, the center 6 from 768px up. */
.filters {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-block: var(--spacing-sm);
  border-top: 1px dotted var(--color-grey-5);
  border-bottom: 1px dotted var(--color-grey-5);
  color: var(--color-grey-1);

  @media (min-width: 768px) {
    grid-column: 4 / span 6;
  }
}

.filter-pill {
  border: 1px solid currentColor;
  border-radius: 2rem;
  padding: 0.2rem 1.2rem;
  background-color: transparent;
  color: inherit;
  transition:
    background-color 0.3s,
    color 0.3s;

  &.active {
    background-color: var(--color-grey-1);
    color: var(--color-black);
  }
}

/* Same column as the filter row: full width on mobile, the center 6 from
   768px up. Under 768px each card's chip tab hangs ABOVE its body (the
   NotchPanel tab-top variant), so the list carries extra headroom per card
   — overriding the space-y-base utility, which loses to unlayered scoped
   CSS. */
.posts {
  grid-column: 1 / -1;
  /* Above the shoe-outline overlay (z 20) — the outlines are page
     background, not something to draw over the cards. */
  position: relative;
  z-index: 30;

  @media (max-width: 767px) {
    padding-top: 3rem;

    > li + li {
      margin-top: calc(var(--spacing-base) + 5rem);
    }
  }

  @media (min-width: 768px) {
    grid-column: 4 / span 6;
  }
}

.feed-empty {
  grid-column: 1 / -1;
  color: var(--color-grey-5);
  padding-block: var(--spacing-base);

  @media (min-width: 768px) {
    grid-column: 4 / span 6;
  }
}

/* Same column as the list, centered under it; pill look shared with the
   filters. Above the shoe overlay (z 20) so it stays clickable. */
.load-more {
  grid-column: 1 / -1;
  justify-self: center;
  position: relative;
  z-index: 30;
  color: var(--color-grey-1);

  &:disabled {
    opacity: 0.5;
  }

  @media (min-width: 768px) {
    grid-column: 4 / span 6;
  }
}

.stub {
  grid-column: 1 / -1;
}
</style>

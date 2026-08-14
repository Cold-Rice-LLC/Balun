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

    <template v-if="posts.length">
      <!-- Single-select category filter, mirrored into ?filter= so filtered
           views are shareable URLs. Clicking the active pill clears it. -->
      <nav
        class="filters font-tertiary text-xs"
        aria-label="Filter posts"
      >
        <span>{{ $t('feed.filter') }}</span>

        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          class="filter-pill"
          :class="{ active: activeFilter === cat }"
          :aria-pressed="activeFilter === cat"
          @click="toggleFilter(cat)"
        >
          {{ $t(`feed.categories.${cat}`) }}
        </button>
      </nav>

      <ul
        v-if="filteredPosts.length"
        class="posts space-y-base"
      >
        <li
          v-for="post in filteredPosts"
          :key="post._id"
          class="post"
        >
          <p class="meta text-2xs uppercase">
            <span class="category">{{ post.category }}</span>
            <span v-if="post.publishedAt"> · {{ formatDate(post.publishedAt) }}</span>
          </p>

          <h2 class="uppercase text-lg">{{ post.title }}</h2>

          <img
            v-if="post.coverImage"
            :src="urlFor(post.coverImage)"
            :alt="post.title"
            class="cover"
            loading="lazy"
          />

          <div
            v-if="post.body"
            class="post-body space-y-base"
          >
            <SanityContent :value="post.body" />
          </div>
        </li>
      </ul>

      <p
        v-else
        class="feed-empty font-quaternary text-xs"
      >
        {{ $t('feed.empty') }}
      </p>
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
import { feedQuery } from '~/utils/queries'

// Matches the feedPost schema's category list; values double as the
// language-agnostic ?filter= URL values (labels translate, slugs don't).
const CATEGORIES = ['stream', 'products', 'events', 'blog']

// Feed content is translated: keyed by language so each caches separately and
// switching language refetches in place. Category/date/image are language-
// agnostic; title/body resolve $lang in the query.
const market = useMarket()
const sanity = useSanity()
const { data: feed } = await useAsyncData(
  () => `feed-${market.value.lang}`,
  () => sanity.fetch(feedQuery, { lang: market.value.lang }),
  { watch: [() => market.value.lang] },
)

const posts = computed(() => feed.value?.posts ?? [])

// The URL is the filter state — SSR renders a shared ?filter= link already
// filtered. Unknown values are ignored rather than showing an empty page.
const route = useRoute()
const router = useRouter()
const activeFilter = computed(() => (CATEGORIES.includes(route.query.filter) ? route.query.filter : null))

// replace, not push: pill toggles shouldn't stack up in browser history.
const toggleFilter = (cat) => {
  router.replace({
    query: { ...route.query, filter: activeFilter.value === cat ? undefined : cat },
  })
}

const filteredPosts = computed(() =>
  activeFilter.value ? posts.value.filter((p) => p.category === activeFilter.value) : posts.value,
)

const urlFor = useSanityImage()

// Localized date, matching the active locale's language.
const formatDate = (iso) => new Intl.DateTimeFormat(market.value.locale, { dateStyle: 'long' }).format(new Date(iso))

useHead({
  title: () => `Feed — Balun`,
  bodyAttrs: { class: 'template-feed' },
})
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

.posts {
  grid-column: 1 / -1;
  color: var(--color-grey-1);

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

.stub {
  grid-column: 1 / -1;
}

.post {
  padding-bottom: var(--spacing-base);
  border-bottom: 1px solid var(--color-grey-7);

  &:last-child {
    border-bottom: none;
  }
}

.meta {
  color: var(--color-grey-4);
  margin-bottom: var(--spacing-xs);
}

.cover {
  width: 100%;
  height: auto;
  border-radius: var(--radius-def);
  margin-top: var(--spacing-sm);
}

.post-body {
  margin-top: var(--spacing-sm);
  color: var(--color-grey-4);

  :deep(a) {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}

</style>

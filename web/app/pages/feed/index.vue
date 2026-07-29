<template>
  <div class="feed-page px-base enter-in-fade-up">
    <ul
      v-if="posts.length"
      class="posts space-y-base"
    >
      <li
        v-for="post in posts"
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
          <SanityContent :blocks="post.body" />
        </div>
      </li>
    </ul>

    <div
      v-else
      class="h-svh flex justify-center items-center"
    >
      <h1>Feed</h1>
    </div>
  </div>
</template>

<script setup>
import { feedQuery } from '~/utils/queries'

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

const urlFor = useSanityImage()

// Localized date, matching the active locale's language.
const formatDate = (iso) => new Intl.DateTimeFormat(market.value.locale, { dateStyle: 'long' }).format(new Date(iso))
</script>

<style scoped>
.feed-page {
  padding-top: calc(var(--spacing-button-lg-height) + var(--spacing-base) * 2);
  padding-bottom: var(--spacing-base);
  max-width: 48rem;
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

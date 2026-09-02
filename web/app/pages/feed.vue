<template>
  <FeedLanding
    :inert="detailOpen"
    :feed="feed"
    :filter="filter"
    :posts="posts"
    :has-more="hasMore"
    :loading-more="loadingMore"
    @load-more="loadMore"
  />

  <NuxtPage />
</template>

<script setup>
/**
 * Parent of /feed (index child, draws nothing) and /feed/[slug] (the detail
 * modal). Owning the landing here keeps it mounted while the child swaps:
 * opening or closing a post neither refetches nor re-renders the list, and
 * only the modal animates (it animates itself — see FeedDetail — so the
 * empty index child needs no page transition). The loaded posts are
 * provided to the detail child so a post opened from the list mounts from
 * data already in hand. The landing is filtered by ?filter= and paged by
 * load more (see useFeedPage).
 */
const { t } = useI18n()
const route = useRoute()
const detailOpen = computed(() => !!route.params.slug)
const { data: feed, filter, posts, hasMore, loadingMore, loadMore } = await useFeedPage()
provide(feedPostsKey, posts)

// The detail child's chunk: in production the visible cards' NuxtLinks
// prefetch it, but NuxtLink skips that in dev, where opening the first
// post would wait on the import. Load it up front either way (a no-op once
// it's in).
const localePath = useLocalePath()
onMounted(() => preloadRouteComponents(localePath('/feed/_')))

useHead({
  title: () => `${t('meta.feed')} — Balun`,
  bodyAttrs: { class: 'template-feed' },
})
</script>

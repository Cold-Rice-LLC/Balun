<template>
  <FeedDetail :post="post" />
</template>

<script setup>
import { feedPostQuery } from '~/utils/queries'

// A post's detail, shown as a modal over the feed landing (the parent
// route's, see feed.vue). The landing underneath is the page/filter in the
// URL — carried over from the card link; unfiltered on a direct visit.
// Opening is a new path to the router, which would scroll to the top; the
// landing stays where it was under the modal instead.
definePageMeta({ scrollToTop: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const market = useMarket()
const sanity = useSanity()

// Opened from the list, the post is already in hand: the landing's loaded
// posts (provided by the parent route) carry the same projection, so the
// modal mounts at once rather than after a round trip. Direct links, and
// posts not in that list, fetch.
const listed = inject(feedPostsKey, ref([]))
const { data: post } = await useAsyncData(
  () => `feed-post-${slug.value}-${market.value.lang}`,
  () => sanity.fetch(feedPostQuery, { slug: slug.value, lang: market.value.lang }),
  {
    getCachedData: (key, nuxtApp) =>
      nuxtApp.payload.data[key] ??
      nuxtApp.static.data[key] ??
      listed.value.find((p) => p.slug === slug.value),
    watch: [slug, () => market.value.lang],
  },
)

// SSR miss.
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}
// Client-side navigation to an unknown slug — setup won't re-run, so guard
// reactively once the in-place refetch resolves to nothing.
watch(post, (value) => {
  if (!value) showError({ statusCode: 404, statusMessage: 'Post not found' })
})

useHead({
  title: () => `${post.value?.title ?? ''} — Balun`,
})
</script>

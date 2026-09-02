import type { InjectionKey, Ref } from 'vue'
import { feedQuery, feedPostsQuery, FEED_PAGE_SIZE } from '~/utils/queries'

// Matches the feedPost schema's category list; values double as the
// language-agnostic ?filter= URL values (labels translate, slugs don't).
export const FEED_CATEGORIES = ['stream', 'products', 'events', 'blog']

// The active category filter from the URL query, or null for all. Unknown
// values are ignored rather than showing an empty page.
export const feedFilter = (query: Record<string, unknown>) => {
  const raw = query.filter
  return typeof raw === 'string' && FEED_CATEGORIES.includes(raw) ? raw : null
}

// The feedPostProjection shape, loosely — components read it untyped.
type FeedPost = { _id: string; slug: string; publishedAt: string; [key: string]: unknown }

// The landing's loaded posts, provided by the feed route to its detail child
// (see pages/feed.vue / pages/feed/[slug].vue).
export const feedPostsKey: InjectionKey<Ref<FeedPost[]>> = Symbol('feedPosts')

/**
 * The feed list, cursor-paginated load-more style. The first page is fetched
 * per language + filter (the filter lives in ?filter=, so a filtered view is
 * a shareable URL that SSR renders already filtered); later pages append in
 * place via loadMore, and the list resets whenever that base fetch swaps.
 * Each batch arrives one over page size — the extra row only signals another
 * page exists.
 *
 * Lives in the parent feed route, which stays mounted while the detail modal
 * opens and closes over it — so the loaded pages, the filter and the scroll
 * position all survive opening a post.
 */
export const useFeedPage = async () => {
  const route = useRoute()
  const market = useMarket()
  const sanity = useSanity()

  const filter = computed(() => feedFilter(route.query))

  const { data } = await useAsyncData(
    () => `feed-${market.value.lang}-${filter.value ?? 'all'}`,
    () => sanity.fetch(feedQuery, { lang: market.value.lang, category: filter.value }),
    { watch: [() => market.value.lang, filter] },
  )

  const posts = ref<FeedPost[]>([])
  const hasMore = ref(false)
  const takePage = (batch: FeedPost[], { reset = false } = {}) => {
    hasMore.value = batch.length > FEED_PAGE_SIZE
    const page = batch.slice(0, FEED_PAGE_SIZE)
    posts.value = reset ? page : [...posts.value, ...page]
  }
  watch(data, (d) => takePage(d?.posts ?? [], { reset: true }), { immediate: true })

  const loadingMore = ref(false)
  const loadMore = async () => {
    const last = posts.value[posts.value.length - 1]
    if (!last) return
    loadingMore.value = true
    try {
      takePage(
        await sanity.fetch(feedPostsQuery, {
          lang: market.value.lang,
          category: filter.value,
          cursorDate: last.publishedAt,
          cursorId: last._id,
        }),
      )
    } finally {
      loadingMore.value = false
    }
  }

  return { data, filter, posts, hasMore, loadingMore, loadMore }
}

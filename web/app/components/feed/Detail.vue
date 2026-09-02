<template>
  <Transition
    name="feed-detail"
    :duration="400"
    @after-enter="focusClose"
    @after-leave="afterLeave"
  >
    <div
      v-if="open"
      class="feed-detail"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <button
        class="backdrop"
        @click="close"
      >
        <span class="sr-only">{{ $t('feed.close') }}</span>
      </button>

      <NotchPanel
        class="panel tab-top-max-md"
        :class="`cat-${post.category}`"
      >
        <article class="content uppercase">
          <div>
            <p>{{ formatFeedDate(post.publishedAt) }}</p>
            <h1
              :id="titleId"
              class="text-lg md:text-xl leading-none"
            >
              {{ post.title }}
            </h1>
          </div>

          <img
            v-if="post.coverImage"
            :src="urlFor(post.coverImage, { w: 2000 })"
            alt=""
            class="cover rounded-def"
          />

          <p
            v-if="post.excerpt"
            class="excerpt font-secondary text-base normal-case"
          >
            {{ post.excerpt }}
          </p>

          <a
            v-if="post.category === 'events' && post.link"
            class="rsvp self-start text-lg bg-black text-grey-1 rounded-lg leading-none px-4 py-2"
            :href="post.link"
            target="_blank"
            rel="noopener"
          >
            {{ $t('feed.rsvp') }}
          </a>

          <component
            :is="moduleComponents[m._type]"
            v-for="m in modules"
            :key="m._key"
            :module="m"
          />

          <HomeVideo
            v-if="post.category === 'stream' && post.recapVideo?.poster"
            :module="post.recapVideo"
          />
        </article>

        <template #tab>
          <button
            ref="closeButton"
            class="close"
            @click="close"
          >
            <IconsX />
            <span class="sr-only">{{ $t('feed.close') }}</span>
          </button>
        </template>
      </NotchPanel>
    </div>
  </Transition>
</template>

<script setup>
/**
 * Feed detail as a modal over the landing (bones — layout to come): a
 * NotchPanel in the post's category color with the X button in its tab,
 * over a dimmed backdrop. The page underneath is scroll-locked; the panel
 * scrolls within the overlay instead.
 *
 * This is a route (/feed/[slug], a child of the feed route so the landing
 * stays mounted underneath), not popup state: the feed underneath is
 * whatever page/filter the URL carries (page one on a direct link), so
 * closing returns to exactly the list the visitor left. Close goes back in
 * history when the previous entry was the feed (so the back button and the
 * X agree), otherwise pushes the feed — a direct link has no feed behind it
 * to go back to.
 *
 * Open and close animate here rather than as a page transition: the sibling
 * index route draws nothing, which a page transition can't animate against.
 * Opening plays on client navigations only (a direct load hydrates in
 * place); closing holds the route change until the leave animation ends —
 * a route-leave guard, so the X, Escape and the back button all animate
 * alike.
 */
const props = defineProps({
  post: { type: Object, required: true },
})

const urlFor = useSanityImage()
const titleId = useId()

// The post's modular content (Text, Image, Video, Links). String names don't
// resolve components in dynamic :is at runtime; filtered to known types so a
// module added in the Studio before its component ships can't crash it.
const moduleComponents = {
  moduleFeedText: resolveComponent('FeedModuleText'),
  moduleFeedImage: resolveComponent('FeedModuleImage'),
  moduleVideo: resolveComponent('HomeVideo'),
  moduleFeedLinks: resolveComponent('FeedModuleLinks'),
}
const modules = computed(() => (props.post.modules ?? []).filter((m) => m._type in moduleComponents))

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const close = () => {
  const feedPath = localePath('/feed')
  const back = window.history.state?.back
  if (typeof back === 'string' && (back === feedPath || back.startsWith(`${feedPath}?`))) {
    router.back()
  } else {
    router.push({ path: feedPath, query: route.query })
  }
}

useScrollLock(ref(true))
onKeyStroke('Escape', close)

// Opening animates on client navigations only: the modal starts closed and
// opens on mount, so the Transition plays a normal enter. Server render and
// hydration start open — no animation, and nothing for the client to catch
// up on. (Not `appear`: Vue's SSR compiler wraps a Transition carrying that
// prop — even bound false — in a <template>, hiding a directly loaded modal
// until hydration.)
const open = ref(import.meta.server || useNuxtApp().isHydrating)

// Focus lands on the close button so keyboard users start inside the
// dialog — once it exists: right away when hydrating open, after the enter
// on a client navigation.
const closeButton = ref(null)
const focusClose = () => closeButton.value?.focus()
onMounted(() => {
  if (open.value) focusClose()
  else open.value = true
})

// Closing holds the route change until the leave animation ends.
let resolveLeft
const afterLeave = () => resolveLeft?.()
onBeforeRouteLeave(async () => {
  if (!open.value) return
  const left = new Promise((resolve) => {
    resolveLeft = resolve
  })
  open.value = false
  await left
})
</script>

<style scoped>
/* Same stacking tier as the cart overlay: over the page, under the navs
   (5000). Scrolls the panel within itself while the page is locked. A flex
   column so the panel's auto margins center it when it's shorter than the
   window — unlike align-items, auto margins give way (to 0) once it's
   taller, so the top never scrolls out of reach. */
.feed-detail {
  position: fixed;
  inset: 0;
  z-index: 4800;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  /* Headroom for the mobile tab-top nipple (5rem) above the panel, plus
     clearance for the fixed navs. */
  padding: calc(var(--spacing-page-top) + 5rem) var(--spacing-base) 15rem;

  @media (min-width: 768px) {
    padding-top: calc(var(--spacing-page-top) + 2rem);
    /* Room for the side tab, which hangs outside the panel's box. */
    padding-right: calc(var(--spacing-base) + 5rem);
  }
}

.backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
}

/* About the feed list's column: the center 6 of 12 on desktop. */
.panel {
  --notch-tab-size: 5rem;

  position: relative;
  width: 100%;
  max-width: 90rem;
  margin: auto;
}

/* Open/close: the backdrop fades and the panel fades up, the reverse on
   close. Each layer animates its own opacity — fading the overlay root
   instead would put the backdrop's blur inside an opacity group, which has
   to re-blur every frame and stutters. The root carries no transition, so
   the duration is set on <Transition> rather than read from the element. */
.feed-detail-enter-active,
.feed-detail-leave-active {
  .backdrop {
    transition: opacity 0.4s var(--curve);
  }

  .panel {
    transition:
      opacity 0.4s var(--curve),
      transform 0.4s var(--curve);
  }
}

.feed-detail-enter-from,
.feed-detail-leave-to {
  .backdrop {
    opacity: 0;
  }

  .panel {
    opacity: 0;
    transform: translateY(2rem);
  }
}

.panel :deep(.panel-tab) {
  width: var(--notch-tab-size);
  height: var(--notch-tab-size);
}

.close {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close :deep(.icon-x) {
  width: 2.4rem;
}

/* Children stretch to the panel's width — modules fill it; the RSVP pill
   opts out with self-start. */
.content {
  min-height: 30rem;
  padding: var(--spacing-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

/* The shared video module sizes itself for the home/info grid (inset, 55%
   wide); in the panel it fills the column like the other modules. */
.content :deep(.video-module) {
  padding: 0;
}

.content :deep(.video-module .media-wrap) {
  width: 100%;
}

.cover {
  width: 100%;
}

.excerpt {
  max-width: 44rem;
  line-height: 1.1;
}

</style>

<template>
  <section
    v-if="texts.length"
    class="marquee-module"
  >
    <!-- The animated track repeats the texts visually; screen readers get
         the single real run and skip the duplicates. -->
    <span class="sr-only">{{ texts.join(', ') }}</span>

    <component
      :is="module.link?.linkType ? AppLink : 'div'"
      :link="module.link?.linkType ? module.link : undefined"
      class="band"
    >
      <div
        class="track uppercase text-lg"
        aria-hidden="true"
      >
        <!-- Two identical groups; the loop slides one group's width so the
             seam is invisible. Each text is followed by a dot — including
             the last, so the dot also separates one run from the next. -->
        <span
          v-for="group in 2"
          :key="group"
          class="flex flex-none items-center"
        >
          <template
            v-for="copy in COPIES"
            :key="copy"
          >
            <template
              v-for="(text, i) in texts"
              :key="i"
            >
              <span class="leading-none">{{ text }}</span>
              <span class="size-[0.25em] mx-[1em] flex-none rounded-full bg-current"></span>
            </template>
          </template>
        </span>
      </div>
    </component>
  </section>
</template>

<script setup>
/**
 * Home module: animated marquee band of repeating text — one or more texts
 * in order, a dot after each. Optional link makes the whole band clickable
 * (AppLink handles internal vs external); the texts themselves are the
 * label — the Sanity linkTarget carries none.
 */
const AppLink = resolveComponent('AppLink')

const props = defineProps({
  module: { type: Object, required: true },
})

// Entries with no text in any language would render as a stray dot.
const texts = computed(() => (props.module.texts ?? []).filter(Boolean))

// Enough copies per group to cover any viewport width even for one short text.
const COPIES = 6
</script>

<style scoped>
.marquee-module {
  /* No negative margin-inline here: the home page pads only top/bottom, so
     the band is already full bleed — pulling it wider just pushed it past
     the viewport and gave the body a horizontal scrollbar. */
  overflow: hidden;
  background-color: var(--color-yellow);
  color: var(--color-grey-5);
}

.band {
  display: block;
  padding: 0.2rem 0;
}

.track {
  display: flex;
  width: max-content;
  white-space: nowrap;
  animation: marquee-scroll 70s linear infinite;
}

@keyframes marquee-scroll {
  to {
    /* One group's width — track is two identical groups, so the restart
       lands on an identical frame. */
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .track {
    animation: none;
  }
}
</style>

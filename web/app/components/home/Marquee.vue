<template>
  <section
    v-if="module.text"
    class="marquee-module"
  >
    <!-- The animated track repeats the text visually; screen readers get the
         single real copy and skip the duplicates. -->
    <span class="sr-only">{{ module.text }}</span>

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
             seam is invisible. -->
        <span
          v-for="group in 2"
          :key="group"
          class="group"
        >
          <span
            v-for="copy in COPIES"
            :key="copy"
            class="copy"
            >{{ module.text }}</span
          >
        </span>
      </div>
    </component>
  </section>
</template>

<script setup>
/**
 * Home module: animated marquee band of repeating text. Optional link makes
 * the whole band clickable (AppLink handles internal vs external); the text
 * itself is the label — the Sanity linkTarget carries none.
 */
const AppLink = resolveComponent('AppLink')

defineProps({
  module: { type: Object, required: true },
})

// Enough copies per group to cover any viewport width even for short text.
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

.group {
  display: flex;
  flex: none;
}

.copy {
  padding-right: 1em;
  line-height: 1;
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

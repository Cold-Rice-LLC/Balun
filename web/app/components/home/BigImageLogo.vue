<template>
  <section
    class="big-image-logo"
    :class="{ 'is-contained': contained }"
  >
    <div class="inner">
      <HomeModuleMedia
        class="media"
        :media="module"
      />

      <IconsWordmark class="wordmark" />
    </div>
  </section>
</template>

<script setup>
/**
 * Home module: a full-viewport media hero (image or silent video loop) with
 * the balun wordmark overlaid near the bottom. Full Width bleeds edge to
 * edge with a white wordmark; Contained insets the media into a rounded-top
 * panel between the header and bottom nav, yellow wordmark flush to the
 * panel's bottom edge.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

const contained = computed(() => props.module.style === 'contained')
</script>

<style scoped>
.big-image-logo {
  position: relative;
  height: calc(100svh - var(--spacing-button-lg-height) - var(--spacing-base));
  overflow: hidden;
  min-height: 70rem;

  &.is-contained {
    height: 100svh;
    padding: var(--spacing-page-top) 8rem calc(var(--spacing-md) + var(--spacing-button-lg-height));

    .inner {
      position: relative;
      width: 100%;
      height: 100%;
      border-top-left-radius: var(--radius-def);
      border-top-right-radius: var(--radius-def);
      overflow: hidden;
    }

    /* Flush at every width — this higher-specificity rule beats the base
       rule's mobile gutter offsets, so only the full-width mark moves
       inward on small screens. The +1px guards a seam against the panel's
       right clip edge. */
    .wordmark {
      bottom: 0;
      left: 0;
      width: calc(100% + 1px);
      color: var(--color-yellow);
    }
  }
}

.media {
  position: absolute;
  inset: 0;
}

/* Both left and right pin the width; aspect-ratio + height:auto then keeps
   the mark's proportions (an <svg> has no intrinsic ratio in CSS). The
   translateY hangs the font's bottom bearing past the section edge, where
   the overflow clip trims it. Inset by the gutter on mobile; flush from
   768px up. */
.wordmark {
  position: absolute;
  width: 100%;
  inset-inline: var(--spacing-base);
  bottom: var(--spacing-base);
  transform: translateY(1.6%);
  color: var(--color-white);

  @media (min-width: 768px) {
    inset-inline: 0;
    bottom: 0;
  }
}
</style>

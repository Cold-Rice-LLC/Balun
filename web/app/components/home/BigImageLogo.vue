<template>
  <section
    class="big-image-logo"
    :class="{ 'is-contained': contained }"
  >
    <HomeModuleMedia
      class="media"
      :media="module"
    />

    <IconsWordmark class="wordmark" />
  </section>
</template>

<script setup>
/**
 * Home module: a full-viewport media hero (image or silent video loop) with
 * the balun wordmark overlaid near the bottom. Full Width bleeds edge to
 * edge with a white wordmark; Contained insets the media by the page gutter
 * with rounded corners and a yellow wordmark.
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

  &.is-contained {
    height: calc(100svh - var(--spacing-base) * 2);
    margin-inline: var(--spacing-base);

    .media {
      border-radius: var(--radius-def);
    }

    .wordmark {
      inset-inline: var(--spacing-base);
      bottom: var(--spacing-base);
      color: var(--color-yellow);
    }
  }
}

.media {
  position: absolute;
  inset: 0;
}

/* Both left and right pin the width; aspect-ratio + height:auto then keeps
   the mark's proportions (an <svg> has no intrinsic ratio in CSS). */
.wordmark {
  position: absolute;
  width: 100%;
  left: 0px;
  bottom: -6px;
  color: var(--color-white);
}

@media (max-width: 768px) {
  .wordmark {
    inset-inline: var(--spacing-base);
    bottom: var(--spacing-base);
  }
}
</style>

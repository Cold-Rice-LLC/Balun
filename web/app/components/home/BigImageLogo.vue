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
  overflow: hidden;
  min-height: 700px;

  &.is-contained {
    height: 100svh;
    padding: var(--spacing-page-top) 8rem calc(var(--spacing-md) + var(--spacing-button-lg-height)) 8rem;

    .inner {
      border-top-left-radius: var(--radius-def);
      border-top-right-radius: var(--radius-def);
      overflow: hidden;
      position: relative;
      width: 100%;
      height: 100%;
    }

    .wordmark {
      bottom: 0px;
      width: calc(100% + 1px);
      left: 0px;
      color: var(--color-yellow);
      transform: translateY(1.6%);
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
  bottom: -7px;
  color: var(--color-white);
}

@media (max-width: 768px) {
  .wordmark {
    inset-inline: var(--spacing-base);
    bottom: var(--spacing-base);
  }
}
</style>

<template>
  <section class="headline-over-image">
    <div class="media-wrap">
      <HomeModuleMedia
        class="media"
        :media="module"
      />

      <h2
        v-if="module.headline"
        class="headline text-center"
      >
        {{ module.headline }}
      </h2>
    </div>

    <AppLink
      v-if="showLink"
      :link="module.link"
      class="link font-secondary uppercase"
    >
      {{ module.linkLabel }}
      <span aria-hidden="true">→</span>
    </AppLink>
  </section>
</template>

<script setup>
/**
 * Home module: a full-viewport panel with the media (image or silent video
 * loop) inset to about half the window width — rounded, centered — and a
 * large yellow headline spanning the window width, overlapping the media at
 * its center. An optional caption-style link sits under the media.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

// AppLink needs a target to render; editors can save a label before wiring it.
const showLink = computed(() => props.module.linkLabel && props.module.link?.linkType)
</script>

<style scoped>
.headline-over-image {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100svh;
}

/* Positioning context for the headline: its center is the media's center, so
   the caption below doesn't shift the overlap point. max-height keeps short
   viewports from letting the aspect ratio outgrow the panel (the media
   cover-fits whatever box remains). */
.media-wrap {
  position: relative;
  width: 85%;
  aspect-ratio: 16 / 9;
  max-height: 55svh;

  @media (min-width: 768px) {
    width: 55%;
  }
}

.media {
  border-radius: var(--radius-def);
}

/* Sized against the window, not the media-wrap: the headline spans (nearly)
   the full window width while the media stays at half. No z-index needed —
   absolute positioning already paints it over the static media. */
.headline {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100vw - var(--spacing-base) * 2);
  color: var(--color-yellow);
  font-size: clamp(4rem, 8vw, 16rem);
  line-height: 1;
}

.link {
  margin-top: var(--spacing-base);
  color: var(--color-grey-6);
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.5;
  }
}
</style>

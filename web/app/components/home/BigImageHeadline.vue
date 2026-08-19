<template>
  <section
    class="big-image-headline"
    :class="{ 'is-contained': contained }"
  >
    <!-- Wrapper so the contained variant's radius clips the media AND the
         overlays together (same box as Big Image + Logo's). Unstyled when
         full width — the overlays then position against the section. -->
    <div class="inner">
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

      <div
        v-if="links.length"
        class="links font-secondary uppercase"
      >
        <AppLink
          v-for="item in links"
          :key="item._key"
          :link="item.link"
          class="link"
        >
          {{ item.label }}
          <span aria-hidden="true">→</span>
        </AppLink>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * Home module: a media hero (image or silent video loop) with a large yellow
 * headline over the media and a row of links pinned to the bottom — equal
 * columns, top rule, label left and arrow right. Full Width bleeds edge to
 * edge; Contained insets it into a rounded panel with Big Image + Logo's
 * contained geometry so the two read as one family.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

const contained = computed(() => props.module.style === 'contained')

// AppLink needs a target to render; editors can save a row before wiring it.
const links = computed(() => (props.module.links ?? []).filter((item) => item.link?.linkType))
</script>

<style scoped>
.big-image-headline {
  position: relative;
  height: 80svh;

  @media (min-width: 768px) {
    height: 100svh;
  }

  /* Same inset as Big Image + Logo's contained style: clears the fixed
     header above and the bottom nav below, so the panel sits in the space
     between them. */
  &.is-contained {
    padding: var(--spacing-base);

    @media (min-width: 768px) {
      padding: var(--spacing-page-top) 8rem calc(var(--spacing-md) + var(--spacing-button-lg-height));
    }

    .inner {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: var(--radius-def);
      overflow: hidden;
    }
  }
}

.media {
  position: absolute;
  inset: 0;
}

/* Scrim between the media and the text so the yellow headline and the white
   links hold up over a bright or busy photo. Weighted to the bottom, where
   the links are small, thin, and most at risk; lightest across the middle so
   the image still reads. A pseudo-element rather than markup — and on .inner
   (static when full width, so it resolves against the section instead), which
   is inside the contained variant's clip. */
.inner::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0.55));
  pointer-events: none;
}

/* Above the scrim: the ::after is the last child, so without this the
   overlay would paint over both. */
.headline,
.links {
  z-index: 2;
}

.headline {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - var(--spacing-base) * 2);
  color: var(--color-yellow);
  font-size: clamp(4rem, 6.5vw, 13rem);
  line-height: 1;
}

/* Stacked on mobile; equal columns from 768px up. */
.links {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-base);
  color: var(--color-white);
  gap: var(--spacing-sm);

  @media (min-width: 768px) {
    flex-direction: row;
    gap: var(--spacing-base);
  }
}

.link {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-base);
  border-top: 1px solid currentColor;
  padding-top: var(--spacing-xs);
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.5;
  }
}
</style>

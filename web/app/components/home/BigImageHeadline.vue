<template>
  <section class="big-image-headline">
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
  </section>
</template>

<script setup>
/**
 * Home module: a full-bleed media hero (image or silent video loop) with a
 * large yellow headline over the media and a row of links pinned to the
 * bottom — equal columns, top rule, label left and arrow right.
 */
const props = defineProps({
  module: { type: Object, required: true },
})

// AppLink needs a target to render; editors can save a row before wiring it.
const links = computed(() =>
  (props.module.links ?? []).filter((item) => item.link?.linkType),
)
</script>

<style scoped>
.big-image-headline {
  position: relative;
  height: 100svh;
}

.media {
  position: absolute;
  inset: 0;
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

.links {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  color: var(--color-white);
}

.link {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-base);
  border-top: 1px solid currentColor;
  padding-top: var(--spacing-xs);
}

@media (max-width: 768px) {
  .links {
    flex-direction: column;
  }
}
</style>

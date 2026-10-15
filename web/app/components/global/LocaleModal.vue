<template>
  <!-- Named "Market, United States": the label for screen readers, then the
       visible current value (an aria-label would hide the value). -->
  <button
    ref="triggerEl"
    type="button"
    class="trigger text-lg leading-none"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = true"
  >
    <IconsGlobe />
    <span class="sr-only">{{ label }}, </span>
    <span>{{ currentName }}</span>
  </button>

  <!-- Teleported: the footer wraps its content in pointer-events/overflow
       rules that a fixed overlay shouldn't inherit.

       Target is Nuxt's #teleports div, NOT `body`, because the home page's
       fixed CTAs already teleport to body. Vue writes SSR teleport buffers
       into a target in the order they RESOLVE but hydrates them in
       component-TREE order, claiming one block per teleport — and the home
       page awaits useAsyncData, so its teleport resolved after this
       synchronous footer's while hydrating before it. Sharing body made
       every teleport adopt the previous one's DOM: the market picker
       hydrated onto the language picker's markup, labels, and hrefs.

       These are the only two SSR-injected targets (see Nuxt's renderer —
       other selectors render client-side only), so a third body teleport
       from a synchronous component would reintroduce the shift.

       Both LocaleModals share this target safely: they're synchronous
       siblings in MainFooter, so their resolve order already matches tree
       order. Making either switcher async would break that. -->
  <Teleport to="#teleports">
    <!-- Above the navs: a modal covers everything. inert while closed: the
         modal is only faded out, so without it the locale links would stay
         in the tab order and a closed aria-modal dialog in the tree. -->
    <button
      class="overlay-backdrop z-(--z-modal-backdrop)"
      :class="{ active: open }"
      :inert="!open"
      tabindex="-1"
      @click="open = false"
    >
      <span class="sr-only">{{ $t('locale.closePicker', { label: label.toLowerCase() }) }}</span>
    </button>

    <div
      ref="modalEl"
      class="locale-modal uppercase"
      :class="{ active: open }"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      :inert="!open"
    >
      <p class="modal-label text-sm">{{ label }}</p>

      <!-- A plain list of links (no listbox: that promises arrow-key
           selection); the current locale carries aria-current. -->
      <ul class="text-lg">
        <li
          v-for="item in items"
          :key="item.code"
        >
          <!-- external: a locale switch is a full page load, not a client-side
               transition. In-app it swaps vue-i18n's locale while the OLD page
               is still on screen, so its text/prices re-render in place — a
               flash — before the new page mounts; it also runs the loading
               indicator, which could wedge mid-switch. A hard navigation keeps
               the old paint untouched until the per-locale SSR shell arrives. -->
          <NuxtLink
            :to="switchLocalePath(item.code)"
            :class="{ 'is-active': item.active }"
            :aria-current="item.active ? 'true' : undefined"
            external
            @click="onSelect"
          >
            {{ item.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Presentational modal for a locale switcher (market or language). `items`
 * are { name, code, active }; each option is a nuxt-link to switchLocalePath so
 * navigation stays real links (prefetch/SEO), not JS-driven — and `external`
 * ones at that, so switching is a full page load (see the template comment).
 * The trigger opens
 * a centered grey panel over a blurred backdrop (same pattern as the cart and
 * quick-add overlays); closes on backdrop click, Escape, or selection.
 */
const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, default: () => [] },
})

const switchLocalePath = useSwitchLocalePath()
const open = ref(false)

// A locale switch is a hard reload that lands back on the same page — the
// home intro shouldn't replay over it. Timestamped so it can only suppress
// the load it belongs to (the intro's gate script consumes it, and ignores
// anything stale — e.g. a switch made from another page).
const onSelect = () => {
  open.value = false
  try {
    sessionStorage.setItem('balun-intro-skip', String(Date.now()))
  } catch {
    // Storage unavailable (privacy mode) — the intro just plays.
  }
}

const currentName = computed(() => props.items.find((i) => i.active)?.name ?? props.items[0]?.name ?? '')

onKeyStroke('Escape', () => {
  if (open.value) open.value = false
})

useScrollLock(open)

// Focus moves to the current locale's link on open (the modal is teleported
// to the end of the document, so it would otherwise stay on the trigger
// behind the backdrop) and back to the trigger on close.
const triggerEl = ref(null)
const modalEl = ref(null)
useOverlayFocus(open, {
  root: () => modalEl.value,
  initial: () => modalEl.value?.querySelector('a.is-active') ?? modalEl.value?.querySelector('a'),
  fallback: () => triggerEl.value,
})
</script>

<style scoped>
.trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-grey-4);
  cursor: pointer;
  transition: color 0.3s;
  pointer-events: auto;
  text-transform: uppercase;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--color-grey-7);
  }

  svg {
    width: 1.1em;
  }

  span {
    flex: none;
  }
}

.locale-modal {
  position: fixed;
  z-index: var(--z-modal);
  top: 50%;
  left: 50%;
  min-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background-color: var(--color-grey-1);
  border-radius: var(--radius-def);
  color: var(--color-grey-6);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.modal-label {
  color: var(--color-grey-5);
}

ul {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  line-height: 1;

  a {
    display: block;
    white-space: nowrap;
    transition: color 0.2s;

    &:hover {
      color: var(--color-grey-7);
    }

    &.is-active {
      color: var(--color-grey-7);
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }
  }
}
</style>

<template>
  <footer class="relative">
    <!-- Stacked in DOM order up to 1440px: newsletter, the links row,
         wordmark at the very bottom. From 1440px the links-container
         overlays the wordmark absolutely, so the order change is invisible
         there. Narrower, the overlay's text-lg links ran into the letters
         (and off the screen at 768); the links half needs ~670px. -->
    <div class="links-container min-[1440px]:absolute min-[1440px]:inset-0 grid min-[1440px]:grid-cols-2 gap-y-base min-[1440px]:gap-y-0 px-gutter">
      <div class="newsletter">
        <EmailSignup />
      </div>

      <div class="footer-links flex justify-between items-start">
        <nav
          class="text-base md:text-lg text-left uppercase leading-none"
          :aria-label="$t('footer.links')"
        >
          <ul>
            <li
              v-for="(link, i) in primaryLinks"
              :key="i"
            >
              <AppLink :link="link" />
            </li>
          </ul>
        </nav>

        <div class="flex items-end flex-col gap-y-sm">
          <div class="flex items-end flex-col">
            <MarketSwitcher />
            <LanguageSwitcher />
          </div>

          <nav
            class="text-right uppercase leading-none"
            :aria-label="$t('footer.legal')"
          >
            <ul>
              <li
                v-for="(link, i) in secondaryLinks"
                :key="i"
              >
                <AppLink :link="link" />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <IconsWordmark />
  </footer>
</template>

<script setup>
const { data: settings } = await useSiteSettings()

const primaryLinks = computed(() => settings.value?.footerPrimaryLinks ?? [])
const secondaryLinks = computed(() => settings.value?.footerSecondaryLinks ?? [])
</script>

<style scoped>
footer {
  padding-bottom: calc(var(--spacing-button-md-height) + var(--spacing-base));
  color: var(--color-grey-4);
  overflow: hidden;

  @media (min-width: 768px) {
    padding-bottom: calc(var(--spacing-button-lg-height) + var(--spacing-base));
  }
}

body.template-home footer {
  margin-top: var(--spacing-lg);

  @media (min-width: 768px) {
    margin-top: var(--spacing-2xl);
  }
}

/* The yellow newsletter page: dark grey text (the wordmark and the signup
   follow it), as on the yellow notch panels, and the signup's focused
   underline goes black rather than light. */
body.template-newsletter footer {
  --signup-focus: var(--color-black);
  color: var(--color-grey-7);
}

body.template-pdp footer,
body.template-shop footer,
body.template-info footer,
body.template-live footer {
  margin-top: var(--spacing-lg);
}

/* Phones and tablets: gutters + clearance above the bottom-of-stack
   wordmark. The 1440px+ overlay layout keeps the deliberate full-bleed (the
   +1px kills a subpixel edge gap). */
:deep(.icon-wordmark) {
  width: calc(100vw - var(--spacing-gutter) * 2);
  height: auto;
  pointer-events: auto;
  margin-top: var(--spacing-base);
  margin-inline: var(--spacing-gutter);

  @media (width >= 1440px) {
    width: calc(100vw + 1px);
    margin-top: 0;
    margin-inline: 0;
  }
}

.newsletter {
  @media (width >= 1440px) {
    padding-left: 8.1vw;
  }
}

.newsletter :deep(p),
.newsletter :deep(input),
.newsletter :deep(button) {
  pointer-events: auto;
}

.footer-links {
  @media (width >= 1440px) {
    padding-left: 11.4vw;
  }
}

/* :deep so the re-enable reaches into child components (switcher triggers)
   — the links-container's pointer-events: none would swallow them. Kept
   top-level: the scoped-CSS compiler mangles :deep() inside nested blocks. */
.footer-links :deep(a),
.footer-links :deep(button) {
  pointer-events: auto;
}

.footer-links :deep(a) {
  transition: color 0.3s;
}

.footer-links :deep(a:hover) {
  color: var(--color-grey-7);
}

body.template-newsletter .footer-links :deep(a:hover) {
  color: var(--color-black);
}

/* The switchers' trigger is text-lg inside LocaleModal (right for desktop
   everywhere it's used); the mobile footer runs a size down like its navs. */
.footer-links :deep(.trigger) {
  font-size: var(--text-base);

  @media (min-width: 768px) {
    font-size: var(--text-lg);
  }
}

.links-container {
  pointer-events: none;
}
</style>

<template>
  <!-- First tab stop on every page: parked above the viewport, slides into
       view only while focused, so sighted keyboard users can jump the fixed
       header and bottom nav. Above --z-nav so the header never covers it. -->
  <a
    href="#main"
    class="fixed top-0 left-0 z-(--z-modal) px-sm py-xs bg-grey-1 text-grey-7 -translate-y-full focus:translate-y-0"
    >{{ $t('nav.skip') }}</a
  >

  <MainNav />
  <SecondaryNav />

  <main id="main">
    <slot />
  </main>

  <MainFooter />
</template>

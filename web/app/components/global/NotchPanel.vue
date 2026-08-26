<template>
  <div class="notch-panel">
    <div class="panel-body">
      <slot />
    </div>

    <div class="panel-tab">
      <slot name="tab" />
    </div>
  </div>
</template>

<script setup>
/**
 * The house panel shape: a rounded body with a tab hanging off the top-right
 * edge ("the nipple"), joined by a concave fillet. Used by the quick-add
 * drawer's close tab, feed cards (category chips in the tab), and the feed
 * detail panel (X button in the tab).
 *
 * The tab and fillet sit OUTSIDE the body rect, so the body background can
 * be anything — solid color or a full-bleed image — without breaking the
 * fillet illusion; only the page behind the panel shows through the carve.
 * Size the tab by sizing the slot content; theme with CSS vars:
 *
 *   --notch-bg          tab background + fillet color (default grey-1); set
 *                       the body's background separately (defaults to same)
 *   --notch-fillet      fillet radius (default 1.7rem)
 *   --notch-radius      body corner radius (default --radius-def)
 *   --notch-tab-radius  tab corner radius (default --notch-radius)
 */
</script>

<style scoped>
.notch-panel {
  position: relative;

  --notch-bg-resolved: var(--notch-bg, var(--color-grey-1));
  --notch-radius-resolved: var(--notch-radius, var(--radius-def));
}

/* Top-right corner stays square — the tab's top edge continues the body's. */
.panel-body {
  overflow: hidden;
  background-color: var(--notch-bg-resolved);
  border-top-left-radius: var(--notch-radius-resolved);
  border-bottom-left-radius: var(--notch-radius-resolved);
  border-bottom-right-radius: var(--notch-radius-resolved);
}

/* Tucked 1px under the body edge: the tab paints separately from the body,
   and two butted antialiased edges composite over the page behind them —
   a hairline seam at the join. The overlap hides under the body's edge
   pixels; same-color paint, so it never shows. */
.panel-tab {
  position: absolute;
  top: 0;
  right: 0;
  transform: translateX(calc(100% - 1px));
  background-color: var(--notch-bg-resolved);
  border-top-right-radius: var(--notch-tab-radius, var(--notch-radius-resolved));
  border-bottom-right-radius: var(--notch-tab-radius, var(--notch-radius-resolved));
}

/* The concave fillet where the tab flows back into the body edge — an
   "inverted border-radius", no SVG needed. A small square hangs just below
   the tab, painted the tab color everywhere EXCEPT a quarter-circle carved
   from its far corner: the arc runs tangent from the tab's bottom edge into
   the body's right edge. The 0.5px overlap in the gradient stops
   anti-aliases the curve. */
.panel-tab::after {
  --fillet: var(--notch-fillet, 1.7rem);

  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: var(--fillet);
  height: var(--fillet);
  background: radial-gradient(
    circle at 100% 100%,
    transparent calc(var(--fillet) - 0.5px),
    var(--notch-bg-resolved) var(--fillet)
  );
  pointer-events: none;
}

/* Mobile variant (`tab-top-max-md` class from the consumer): under 768px
   the tab sits ABOVE the body, still flush right — same geometry rotated a
   quarter turn. Top corners round, bottom-right stays square where the
   tab's right edge continues the body's; the fillet square hangs to its
   LEFT, carving the arc from the tab's left edge into the body's top edge.
   The consumer must leave headroom for the tab (it's outside the body
   rect). From 768px it's the default side tab. */
.notch-panel.tab-top-max-md .panel-tab {
  @media (max-width: 767px) {
    /* Same 1px seam-hiding overlap as the side tab, into the top edge. */
    transform: translateY(calc(-100% + 1px));
    border-top-left-radius: var(--notch-tab-radius, var(--notch-radius-resolved));
    border-bottom-right-radius: 0;
  }
}

.notch-panel.tab-top-max-md .panel-tab::after {
  @media (max-width: 767px) {
    top: auto;
    left: auto;
    bottom: 0;
    right: 100%;
    background: radial-gradient(
      circle at 0 0,
      transparent calc(var(--fillet) - 0.5px),
      var(--notch-bg-resolved) var(--fillet)
    );
  }
}
</style>

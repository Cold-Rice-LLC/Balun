/**
 * The intro's pieces: what they look like, where they start in the first
 * frame, and their collision shapes.
 *
 * Sizes and offsets are in px against a 1440px-wide design and scale down
 * with the viewport below that (never up). The BALUN letters start floating
 * in a row across the middle of the screen, like balloons; the shoes and
 * character wait stacked just above the top edge, then rain down onto them
 * and knock them down. The start layout is plain CSS in the server-rendered
 * overlay; runIntro reads the rendered boxes and plays from exactly there.
 *
 * The letters are the footer wordmark (components/icons/Wordmark.vue) split
 * into one SVG each, in the animation's colours; their sizes and positions
 * keep the wordmark's own proportions and spacing.
 *
 * Hulls are each SVG's convex outline as fractions of its box, sampled every
 * ~10 design px along its paths (the four shoes share one artwork). If an SVG
 * changes, re-sample it — the shape is what the piece tumbles and stacks on.
 */

// Built assets: hashed, long-cached, and served from the CDN with the
// code (app.cdnURL); Vite inlines the smallest as data URIs.
import aSvg from '~/assets/svgs/Vector_A.svg?url'
import bSvg from '~/assets/svgs/Vector_B.svg?url'
import lSvg from '~/assets/svgs/Vector_L.svg?url'
import lavenderShoeSvg from '~/assets/svgs/Vector_LavenderShoe.svg?url'
import limeShoeSvg from '~/assets/svgs/Vector_LimeShoe.svg?url'
import nSvg from '~/assets/svgs/Vector_N.svg?url'
import navyShoeSvg from '~/assets/svgs/Vector_NavyShoe.svg?url'
import redShoeSvg from '~/assets/svgs/Vector_RedShoe.svg?url'
import uSvg from '~/assets/svgs/Vector_U.svg?url'
import characterSvg from '~/assets/svgs/vector_Character.svg?url'

type Hull = [number, number][]

interface Piece {
  src: string
  // Design width; height follows the artwork's ratio.
  width: number
  ratio: number
  // Left edge, from the viewport's center.
  left: number
  // Letters float in the middle of the screen, laid out as in the footer
  // wordmark: `top` is the box's top edge from the viewport's middle. The
  // rest wait above the top edge, `stagger` rows further up each so they
  // rain in one after another.
  top?: number
  letter?: boolean
  stagger?: number
  hull: Hull
}

const SHOE_HULL: Hull = [
  [0, 0.745], [0.002, 0.695], [0.008, 0.646], [0.075, 0.11], [0.081, 0.062], [0.087, 0.02],
  [0.505, 0], [0.525, 0.007], [0.543, 0.026], [0.945, 0.478], [0.963, 0.499], [0.979, 0.53],
  [0.99, 0.572], [0.999, 0.614], [1, 0.665], [0.997, 0.715], [0.99, 0.762], [0.978, 0.801],
  [0.962, 0.831], [0.946, 0.859], [0.91, 0.897], [0.875, 0.924], [0.855, 0.935], [0.818, 0.953],
  [0.799, 0.962], [0.762, 0.974], [0.742, 0.98], [0.687, 0.986], [0.668, 0.987], [0.197, 0.999],
  [0.177, 0.999], [0.142, 0.998], [0.122, 0.993], [0.087, 0.978], [0.069, 0.962], [0.037, 0.909],
  [0.022, 0.88], [0.01, 0.839],
]
const SHOE_RATIO = 968 / 2459

export const INTRO_PIECES: Piece[] = [
  // BALUN, the footer wordmark's letters, across the middle of the screen
  {
    src: bSvg,
    width: 256,
    ratio: 577.56 / 468.52,
    left: -525,
    top: -160,
    letter: true,
    hull: [
      [0, 0], [0.307, 0], [0.888, 0.467], [0.926, 0.504], [0.957, 0.544], [0.98, 0.589],
      [0.995, 0.637], [1, 0.688], [0.995, 0.738], [0.98, 0.786], [0.957, 0.831], [0.926, 0.872],
      [0.888, 0.908], [0.843, 0.94], [0.792, 0.965], [0.737, 0.984], [0.678, 0.996], [0.615, 1],
      [0, 1],
    ],
  },
  {
    src: aSvg,
    width: 256,
    ratio: 360.46 / 468.65,
    left: -261,
    top: -42,
    letter: true,
    hull: [
      [0, 0.499], [0.005, 0.417], [0.02, 0.34], [0.043, 0.268], [0.075, 0.203], [0.114, 0.145],
      [0.159, 0.095], [0.209, 0.055], [0.265, 0.025], [0.324, 0.006], [0.387, 0], [1, 0.023],
      [1, 1], [0.387, 1], [0.324, 0.993], [0.265, 0.975], [0.209, 0.944], [0.159, 0.904],
      [0.114, 0.854], [0.075, 0.796], [0.043, 0.73], [0.02, 0.658], [0.005, 0.581],
    ],
  },
  {
    src: lSvg,
    width: 80,
    ratio: 560.7 / 145.45,
    left: 18,
    top: -151,
    letter: true,
    hull: [
      [0, 0], [1, 0], [1, 1], [0, 1],
    ],
  },
  {
    src: uSvg,
    width: 195,
    ratio: 360.44 / 356.93,
    left: 119,
    top: -37,
    letter: true,
    hull: [
      [0, 0], [1, 0], [1, 0.501], [0.993, 0.582], [0.975, 0.659], [0.944, 0.731], [0.904, 0.796],
      [0.854, 0.854], [0.796, 0.904], [0.731, 0.945], [0.659, 0.975], [0.582, 0.994], [0.501, 1],
      [0.42, 0.994], [0.343, 0.975], [0.271, 0.945], [0.205, 0.904], [0.147, 0.854], [0.097, 0.796],
      [0.056, 0.731], [0.026, 0.659], [0.007, 0.582], [0, 0.501],
    ],
  },
  {
    src: nSvg,
    width: 195,
    ratio: 360.44 / 356.94,
    left: 329,
    top: -42,
    letter: true,
    hull: [
      [0, 0.499], [0.007, 0.418], [0.025, 0.341], [0.056, 0.269], [0.096, 0.204], [0.146, 0.146],
      [0.204, 0.096], [0.269, 0.055], [0.341, 0.025], [0.418, 0.006], [0.499, 0], [0.581, 0.006],
      [0.658, 0.025], [0.73, 0.055], [0.796, 0.096], [0.854, 0.146], [0.904, 0.204], [0.944, 0.269],
      [0.975, 0.341], [0.993, 0.418], [1, 0.499], [1, 1], [0, 1],
    ],
  },
  // Above the screen, in the order they rain in
  { src: redShoeSvg, width: 500, ratio: SHOE_RATIO, left: -640, stagger: 0, hull: SHOE_HULL },
  { src: lavenderShoeSvg, width: 500, ratio: SHOE_RATIO, left: 140, stagger: 1, hull: SHOE_HULL },
  {
    src: characterSvg,
    width: 300,
    ratio: 516 / 531,
    left: -150,
    stagger: 2,
    hull: [
      [0.062, 0.474], [0.066, 0.441], [0.36, 0.205], [0.386, 0.189], [0.787, 0.318], [0.818, 0.33],
      [0.935, 0.502], [0.677, 0.921], [0.648, 0.929], [0.421, 0.849], [0.147, 0.609], [0.127, 0.582],
      [0.077, 0.503],
    ],
  },
  { src: limeShoeSvg, width: 500, ratio: SHOE_RATIO, left: -560, stagger: 3, hull: SHOE_HULL },
  { src: navyShoeSvg, width: 500, ratio: SHOE_RATIO, left: 60, stagger: 4, hull: SHOE_HULL },
]

// Gap above the screen, and between the pieces waiting there.
const WAIT_GAP = 60
const STAGGER_GAP = 130
const DESIGN_WIDTH = 1440

// A design-px length as CSS that scales with the viewport below 1440 px.
const scaled = (px: number) => {
  const rounded = Math.round(px)
  const vw = `${+((px / DESIGN_WIDTH) * 100).toFixed(3)}vw`
  return px >= 0 ? `min(${rounded}px, ${vw})` : `max(${rounded}px, ${vw})`
}

/** The piece's first-frame box, as inline CSS. */
export const introStartStyle = (piece: Piece) => {
  const height = piece.width * piece.ratio
  // Staggered pieces are spaced a fixed step apart, so nothing begins
  // overlapping (matter.js would fling overlapping bodies apart).
  const top = piece.letter
    ? `calc(50% + ${scaled(piece.top ?? -height / 2)})`
    : scaled(-(height + WAIT_GAP + (piece.stagger ?? 0) * STAGGER_GAP))
  return {
    left: `calc(50% + ${scaled(piece.left)})`,
    top,
    width: scaled(piece.width),
    aspectRatio: `${+(1 / piece.ratio).toFixed(4)}`,
  }
}

/**
 * The intro's pieces: what they look like, where they start in the first
 * frame, and their collision shapes.
 *
 * Sizes and offsets are in px against a 1440px-wide design and scale down
 * with the viewport below that (never up). The start layout is plain CSS so
 * the server-rendered first frame already shows the BALUN letters peeking in
 * along the top edge, with the shoes and character waiting above the screen;
 * runIntro reads the rendered boxes and drops them from exactly there.
 *
 * Hulls are each SVG's convex outline as fractions of its box, sampled every
 * ~10 design px along its paths (the four shoes share one artwork). If an SVG
 * changes, re-sample it — the shape is what the piece tumbles and stacks on.
 */

type Hull = [number, number][]

interface Piece {
  src: string
  // Design width; height follows the artwork's ratio.
  width: number
  ratio: number
  // Left edge, from the viewport's center.
  left: number
  // Letters peek in at the top edge; the rest wait above it, `stagger`
  // further up each so they rain in one after another.
  peek?: boolean
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
  // BALUN, centered along the top edge
  {
    src: '/svgs/Vector_B.svg',
    width: 225,
    ratio: 315 / 258,
    left: -597,
    peek: true,
    hull: [
      [0, 0.012], [0.029, 0], [0.295, 0], [0.892, 0.471], [0.921, 0.498], [0.946, 0.528], [0.967, 0.56],
      [0.982, 0.594], [0.993, 0.629], [0.999, 0.665], [1, 0.701], [0.995, 0.737], [0.986, 0.772],
      [0.971, 0.807], [0.952, 0.839], [0.928, 0.87], [0.9, 0.898], [0.869, 0.923], [0.834, 0.945],
      [0.796, 0.964], [0.755, 0.979], [0.713, 0.99], [0.67, 0.997], [0.626, 1], [0.297, 1], [0.032, 1],
      [0, 0.99], [0, 0.954], [0, 0.555], [0, 0.302],
    ],
  },
  {
    src: '/svgs/Vector_A.svg',
    width: 248,
    ratio: 256 / 261,
    left: -348,
    peek: true,
    hull: [
      [0, 0.36], [0.002, 0.319], [0.009, 0.279], [0.02, 0.24], [0.035, 0.203], [0.054, 0.167],
      [0.078, 0.134], [0.104, 0.104], [0.134, 0.077], [0.167, 0.053], [0.202, 0.034], [0.239, 0.019],
      [0.277, 0.008], [0.317, 0.002], [0.357, 0], [0.396, 0.003], [0.436, 0.01], [0.474, 0.022],
      [0.51, 0.039], [0.545, 0.059], [0.573, 0.08], [0.991, 0.446], [0.979, 0.476], [0.954, 0.508],
      [0.853, 0.634], [0.678, 0.856], [0.602, 0.951], [0.577, 0.983], [0.549, 0.983], [0.518, 0.957],
      [0.394, 0.855], [0.363, 0.829], [0.136, 0.642], [0.106, 0.616], [0.079, 0.586], [0.056, 0.553],
      [0.036, 0.517], [0.021, 0.48], [0.009, 0.441], [0.002, 0.401],
    ],
  },
  {
    src: '/svgs/Vector_L.svg',
    width: 225,
    ratio: 231 / 384,
    left: -76,
    peek: true,
    hull: [
      [0, 0.388], [0.016, 0.321], [0.033, 0.253], [0.082, 0.051], [0.105, 0.007], [0.186, 0.062],
      [0.959, 0.582], [0.999, 0.609], [0.933, 0.88], [0.917, 0.947], [0.894, 0.991], [0.772, 0.909],
      [0.691, 0.854], [0.447, 0.69],
    ],
  },
  {
    src: '/svgs/Vector_U.svg',
    width: 200,
    ratio: 1,
    left: 173,
    peek: true,
    hull: [
      [0, 0.526], [0.003, 0.476], [0.008, 0.427], [0.013, 0.378], [0.046, 0.082], [0.051, 0.033],
      [0.071, 0.002], [0.64, 0.064], [0.837, 0.085], [0.985, 0.102], [0.996, 0.138], [0.974, 0.335],
      [0.958, 0.482], [0.953, 0.532], [0.948, 0.581], [0.939, 0.63], [0.926, 0.677], [0.908, 0.723],
      [0.885, 0.767], [0.858, 0.809], [0.826, 0.847], [0.791, 0.881], [0.752, 0.912], [0.71, 0.939],
      [0.666, 0.961], [0.619, 0.978], [0.571, 0.99], [0.522, 0.998], [0.473, 1], [0.424, 0.997],
      [0.375, 0.989], [0.327, 0.976], [0.281, 0.958], [0.237, 0.935], [0.195, 0.908], [0.157, 0.877],
      [0.122, 0.842], [0.091, 0.804], [0.064, 0.762], [0.041, 0.718], [0.023, 0.672], [0.01, 0.624],
      [0.003, 0.575],
    ],
  },
  {
    src: '/svgs/Vector_N.svg',
    width: 200,
    ratio: 208 / 207,
    left: 397,
    peek: true,
    hull: [
      [0.004, 0.546], [0.024, 0.506], [0.079, 0.423], [0.106, 0.381], [0.216, 0.215], [0.244, 0.174],
      [0.275, 0.135], [0.311, 0.101], [0.351, 0.071], [0.394, 0.046], [0.439, 0.026], [0.487, 0.011],
      [0.536, 0.003], [0.586, 0], [0.636, 0.003], [0.685, 0.012], [0.732, 0.027], [0.777, 0.048],
      [0.82, 0.074], [0.859, 0.105], [0.895, 0.14], [0.926, 0.178], [0.951, 0.221], [0.972, 0.266],
      [0.987, 0.313], [0.996, 0.362], [1, 0.412], [0.997, 0.461], [0.989, 0.51], [0.975, 0.558],
      [0.955, 0.603], [0.93, 0.646], [0.821, 0.812], [0.711, 0.978], [0.676, 0.984],
    ],
  },
  // Above the screen, in the order they rain in
  { src: '/svgs/Vector_RedShoe.svg', width: 500, ratio: SHOE_RATIO, left: -640, stagger: 0, hull: SHOE_HULL },
  { src: '/svgs/Vector_LavenderShoe.svg', width: 500, ratio: SHOE_RATIO, left: 140, stagger: 1, hull: SHOE_HULL },
  {
    src: '/svgs/vector_Character.svg',
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
  { src: '/svgs/Vector_LimeShoe.svg', width: 500, ratio: SHOE_RATIO, left: -560, stagger: 3, hull: SHOE_HULL },
  { src: '/svgs/Vector_NavyShoe.svg', width: 500, ratio: SHOE_RATIO, left: 60, stagger: 4, hull: SHOE_HULL },
]

// How much of a letter shows below the top edge in the first frame.
const PEEK_VISIBLE = 0.4
// Gap above the screen, and between each waiting piece.
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
  const top = piece.peek
    ? -height * (1 - PEEK_VISIBLE)
    : -(height + WAIT_GAP + (piece.stagger ?? 0) * STAGGER_GAP)
  return {
    left: `calc(50% + ${scaled(piece.left)})`,
    top: scaled(top),
    width: scaled(piece.width),
    aspectRatio: `${+(1 / piece.ratio).toFixed(4)}`,
  }
}

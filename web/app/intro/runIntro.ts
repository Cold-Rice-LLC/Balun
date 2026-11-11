import Matter from 'matter-js'
import { INTRO_PIECES } from './pieces'

/**
 * The home intro, played on the server-rendered overlay (components/home/
 * Intro.vue) as plain DOM — started by plugins/intro.client.ts before the app
 * hydrates, so the drop doesn't wait on the page's data or components.
 *
 * The BALUN letters float in the middle of the screen like balloons while the
 * shoes and character rain down from above; each letter drops when something
 * lands on it (any still floating go once everything has landed). The pile
 * settles on the floor, then pops: a beat of anticipation, an uneven burst
 * with a shockwave and a light shake, the pieces drifting toward the viewer
 * and fading as they clear, and a hole opening in the white sheet to reveal
 * the page. Pieces move by transform only — no layout per frame.
 */

// World
// Fixed physics step, two per 60fps frame so 120Hz screens stay smooth. Fixed
// matters: a sliver of a step (a frame's leftover fraction) during a contact
// makes matter.js divide by a near-zero time and fling the pieces.
const STEP_MS = 1000 / 120
const GRAVITY = 1.6
const RESTITUTION = 0.45
const FRICTION = 0.05
const FRICTION_AIR = 0.01

// Floating letters: held to their spot (a share of the gap closed per step)
// with a gentle bob, weightless, until struck. Once every falling piece has
// hit something, the letters it missed follow RELEASE_STRAGGLERS_MS later;
// RELEASE_ALL_MS drops them regardless.
const FLOAT_HOLD = 0.12
const FLOAT_BOB_PX = 5
const FLOAT_BOB_MS = 1600
const RELEASE_STRAGGLERS_MS = 120
const RELEASE_ALL_MS = 2000

// Settling: the pop fires once everything is down, on screen and nearly still
// for SETTLE_HOLD_MS, but never before MIN_DROP_MS (let the pile land) nor
// after MAX_DROP_MS (a piece that keeps rocking can't hold up the page).
const MIN_DROP_MS = 1800
const MAX_DROP_MS = 3000
const SETTLE_HOLD_MS = 250
const SETTLED_SPEED = 3

// The pop. Speeds are matter.js velocities (px per 60fps frame).
const ANTICIPATION_MS = 160
const ANTICIPATION_SCALE = 0.95
// A soft burst that drags to a drift (air resistance), weightless, so the
// flight reads instead of blinking off screen. A piece that wouldn't clear
// the screen at its jittered speed before the drag stops it gets just enough
// more (times POP_EXIT_MARGIN), up to POP_MAX_SPEED.
const POP_SPEED = 32
const POP_SPEED_JITTER = 0.25
const POP_DRAG = 0.03
const POP_EXIT_MARGIN = 1.2
const POP_MAX_SPEED = 90
const POP_LIFT = 8
const POP_SPIN = 0.18
const POP_GROWTH = 0.3
const POP_GROWTH_MS = 900
// Pieces fade once clear of the blast, a steady fade the overlay waits for.
const FADE_DELAY_MS = 250
const FADE_MS = 550
const REVEAL_MS = 900
// The hole is fully clear inside this share of its radius, feathered beyond.
const REVEAL_CLEAR = 0.8
const SHAKE_MS = 140
const SHAKE_PX = 5
const RING_MS = 700
const RING_COLOR = 'var(--color-purple)'
// A last beat once the reveal and fade are both done.
const FINISH_MS = 100

const linear = (t: number) => t
const easeInQuad = (t: number) => t * t
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

interface Piece {
  el: HTMLImageElement
  body: Matter.Body
  // Center of mass within the image box, for transform-origin.
  originX: number
  originY: number
  // Half the box's diagonal: how far past an edge it must be to be gone.
  reach: number
  letter: boolean
  // Letters: still floating at their start spot (anchor), bobbing on `phase`.
  floating: boolean
  anchorX: number
  anchorY: number
  phase: number
  // Falling pieces: has hit something yet.
  landed: boolean
}

export const runIntro = (root: HTMLElement, onDone: () => void) => {
  const sheet = root.querySelector<HTMLElement>('.intro-sheet')!
  const engine = Matter.Engine.create()
  engine.gravity.y = GRAVITY

  let width = 0
  let height = 0
  let pieces: Piece[] = []
  let frameId = 0
  let lastFrame = 0
  // Frame time not yet stepped, carried into the next frame.
  let unstepped = 0
  let startedAt = 0
  let settledSince: number | null = null
  let scale = 1
  let paused = false
  let popping = false
  // Screen shake, applied to the pieces' positions while it lasts (shaking
  // the overlay itself would bare the page along its edges).
  let shakeUntil = 0

  const floor = Matter.Bodies.rectangle(0, 0, 6000, 60, { isStatic: true, friction: 0.5 })
  const leftWall = Matter.Bodies.rectangle(0, 0, 60, 4000, { isStatic: true })
  const rightWall = Matter.Bodies.rectangle(0, 0, 60, 4000, { isStatic: true })
  Matter.Composite.add(engine.world, [floor, leftWall, rightWall])

  // Bodies from the first frame's boxes: each piece's hull, scaled to its
  // rendered size, placed exactly where it's drawn.
  const createPieces = () =>
    [...root.querySelectorAll<HTMLImageElement>('.intro-piece')].map((el, i) => {
      const box = el.getBoundingClientRect()
      // Re-hulled after scaling: rounding can leave a point just inside the
      // edge, which matter.js would otherwise try (and warn) to decompose.
      const hull = Matter.Vertices.hull(
        INTRO_PIECES[i]!.hull.map(([x, y]) => ({ x: x * box.width, y: y * box.height })) as Matter.Vector[],
      )
      const centre = Matter.Vertices.centre(hull)
      const body = Matter.Bodies.fromVertices(box.left + centre.x, box.top + centre.y, [hull], {
        restitution: RESTITUTION,
        friction: FRICTION,
        frictionAir: FRICTION_AIR,
      })
      const letter = !!INTRO_PIECES[i]!.letter
      if (!letter) {
        Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: 0 })
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05)
      }
      Matter.Composite.add(engine.world, body)

      // From here on the body places it: pin the box to the corner and move
      // it by transform alone.
      el.style.left = '0'
      el.style.top = '0'
      el.style.transformOrigin = `${centre.x}px ${centre.y}px`
      return {
        el,
        body,
        originX: centre.x,
        originY: centre.y,
        reach: Math.hypot(box.width, box.height) / 2,
        letter,
        floating: letter,
        anchorX: body.position.x,
        anchorY: body.position.y,
        phase: Math.random() * Math.PI * 2,
        landed: false,
      }
    })

  // Floating letters: gravity cancelled, eased back to their bobbing spot
  // and upright each step. Moved by velocity, not position, so a piece that
  // lands on one still collides with it properly.
  Matter.Events.on(engine, 'beforeUpdate', () => {
    const t = (engine.timing.timestamp / FLOAT_BOB_MS) * Math.PI * 2
    for (const piece of pieces) {
      if (!piece.floating) continue
      const { body } = piece
      body.force.y -= body.mass * engine.gravity.y * engine.gravity.scale
      const targetY = piece.anchorY + Math.sin(t + piece.phase) * FLOAT_BOB_PX
      Matter.Body.setVelocity(body, {
        x: (piece.anchorX - body.position.x) * FLOAT_HOLD,
        y: (targetY - body.position.y) * FLOAT_HOLD,
      })
      Matter.Body.setAngularVelocity(body, -body.angle * FLOAT_HOLD)
    }
  })

  const pieceOf = (body: Matter.Body) => pieces.find((piece) => piece.body === body.parent)
  let releaseTimer = 0
  const releaseAll = () => {
    for (const piece of pieces) piece.floating = false
  }

  // A letter drops the moment anything that isn't floating touches it.
  Matter.Events.on(engine, 'collisionStart', ({ pairs }) => {
    for (const { bodyA, bodyB } of pairs) {
      const a = pieceOf(bodyA)
      const b = pieceOf(bodyB)
      for (const [piece, other] of [[a, b], [b, a]] as const) {
        if (!piece) continue
        if (!piece.letter) piece.landed = true
        if (piece.floating && !other?.floating) piece.floating = false
      }
    }
    const allLanded = pieces.every((piece) => piece.letter || piece.landed)
    if (allLanded && !releaseTimer && pieces.some((piece) => piece.floating)) {
      releaseTimer = window.setTimeout(releaseAll, RELEASE_STRAGGLERS_MS)
    }
  })

  const render = (now: number) => {
    const shakeLeft = Math.max(0, shakeUntil - now) / SHAKE_MS
    const shakeX = (Math.random() * 2 - 1) * SHAKE_PX * shakeLeft
    const shakeY = (Math.random() * 2 - 1) * SHAKE_PX * shakeLeft
    for (const { el, body, originX, originY } of pieces) {
      const x = body.position.x - originX + shakeX
      const y = body.position.y - originY + shakeY
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle}rad) scale(${scale})`
    }
  }

  const isSettled = () =>
    pieces.every(
      ({ body, floating, letter, landed }) =>
        !floating && (letter || landed) && body.bounds.min.y > 0 && body.speed < SETTLED_SPEED,
    )

  const frame = (now: number) => {
    if (!root.isConnected) return
    // Real elapsed time, so the fall runs at the same speed on any refresh rate.
    unstepped += lastFrame ? Math.min(now - lastFrame, 50) : STEP_MS
    lastFrame = now
    if (paused) unstepped = 0
    while (unstepped >= STEP_MS) {
      Matter.Engine.update(engine, STEP_MS)
      unstepped -= STEP_MS
    }
    render(now)

    if (!popping) {
      const elapsed = now - startedAt
      if (elapsed >= RELEASE_ALL_MS) releaseAll()
      settledSince = isSettled() ? (settledSince ?? now) : null
      const held = settledSince !== null && now - settledSince >= SETTLE_HOLD_MS
      if ((elapsed >= MIN_DROP_MS && held) || elapsed >= MAX_DROP_MS) pop()
    }
    frameId = requestAnimationFrame(frame)
  }

  // A rAF-driven tween; `apply` gets the eased progress each frame.
  const tween = (ms: number, ease: (t: number) => number, apply: (t: number) => void) =>
    new Promise<void>((resolve) => {
      const from = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - from) / ms, 1)
        apply(ease(t))
        if (t < 1 && root.isConnected) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })

  const shockwave = (x: number, y: number, radius: number) => {
    // On <body>, outside the app: hydration may still be running and must
    // not find a node it didn't render inside the overlay.
    const ring = document.createElement('div')
    Object.assign(ring.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 'calc(var(--z-intro) + 1)',
      borderRadius: '50%',
      border: `0.6rem solid ${RING_COLOR}`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    })
    document.body.appendChild(ring)
    ring
      .animate(
        [
          { width: '0', height: '0', opacity: 1 },
          { width: `${radius * 2}px`, height: `${radius * 2}px`, opacity: 0 },
        ],
        { duration: RING_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      )
      .finished.finally(() => ring.remove())
  }

  // Distance along (ux, uy) from (x, y) until `margin` past the nearest edge.
  const distanceOffScreen = (x: number, y: number, ux: number, uy: number, margin: number) => {
    const alongX = ux > 0 ? (width + margin - x) / ux : ux < 0 ? (-margin - x) / ux : Infinity
    const alongY = uy > 0 ? (height + margin - y) / uy : uy < 0 ? (-margin - y) / uy : Infinity
    return Math.min(alongX, alongY)
  }

  const pop = async () => {
    popping = true
    clearTimeout(releaseTimer)
    releaseAll()

    // Anticipation: the pile holds still and draws in.
    paused = true
    await tween(ANTICIPATION_MS, easeInQuad, (t) => {
      scale = 1 + (ANTICIPATION_SCALE - 1) * t
    })
    paused = false

    // The blast, from the bottom of the pile's middle: walls out of the way,
    // every piece launched outward at its own speed, with lift and spin.
    const originX = pieces.reduce((sum, { body }) => sum + body.position.x, 0) / pieces.length
    const originY = height
    Matter.Body.setPosition(floor, { x: originX, y: height + 3000 })
    Matter.Body.setPosition(leftWall, { x: -3000, y: height / 2 })
    Matter.Body.setPosition(rightWall, { x: width + 3000, y: height / 2 })
    // Weightless from here, so nothing arcs back into view.
    engine.gravity.y = 0
    const grownScale = ANTICIPATION_SCALE + POP_GROWTH
    for (const { body, reach } of pieces) {
      body.frictionAir = POP_DRAG
      // Pieces pass through each other from here: in a packed pile, ones
      // blasted into their neighbours would otherwise lose their speed and
      // stall on screen.
      body.collisionFilter.mask = 0
      const dx = body.position.x - originX
      const dy = body.position.y - originY
      const distance = Math.hypot(dx, dy) || 1
      const jittered = POP_SPEED * (1 + (Math.random() * 2 - 1) * POP_SPEED_JITTER)
      const vx = (dx / distance) * jittered
      const vy = (dy / distance) * jittered - POP_LIFT
      // Drag stops a piece after about speed ÷ drag px of travel.
      const launch = Math.hypot(vx, vy)
      const { x, y } = body.position
      const travel = distanceOffScreen(x, y, vx / launch, vy / launch, reach * grownScale)
      const speed = Math.min(Math.max(launch, travel * POP_DRAG * POP_EXIT_MARGIN), POP_MAX_SPEED)
      Matter.Body.setVelocity(body, { x: (vx / launch) * speed, y: (vy / launch) * speed })
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * POP_SPIN * 2)
    }

    // The hole is sized so its fully clear band reaches the farthest corner.
    const radius = Math.hypot(Math.max(originX, width - originX), originY) / REVEAL_CLEAR
    shockwave(originX, originY, radius)
    shakeUntil = performance.now() + SHAKE_MS
    tween(POP_GROWTH_MS, easeOutCubic, (t) => {
      scale = ANTICIPATION_SCALE + POP_GROWTH * t
    })
    const fade = new Promise<void>((resolve) => setTimeout(resolve, FADE_DELAY_MS)).then(() =>
      tween(FADE_MS, linear, (t) => {
        for (const { el } of pieces) el.style.opacity = `${1 - t}`
      }),
    )
    const reveal = tween(REVEAL_MS, easeOutExpo, (t) => {
      const r = radius * t
      const mask = `radial-gradient(circle ${r}px at ${originX}px ${originY}px, transparent 0%, transparent ${REVEAL_CLEAR * 100}%, black 100%)`
      sheet.style.maskImage = mask
      sheet.style.webkitMaskImage = mask
    })
    await Promise.all([fade, reveal])

    setTimeout(() => {
      cancelAnimationFrame(frameId)
      onDone()
    }, FINISH_MS)
  }

  const begin = () => {
    width = window.innerWidth
    height = window.innerHeight
    // A hidden or prerendered tab can measure 0×0 — wait until it's real.
    if (!width || !height) {
      requestAnimationFrame(begin)
      return
    }
    Matter.Body.setPosition(floor, { x: width / 2, y: height + 30 })
    Matter.Body.setPosition(leftWall, { x: -30, y: height / 2 })
    Matter.Body.setPosition(rightWall, { x: width + 30, y: height / 2 })
    pieces = createPieces()
    // The clock starts on the first rendered frame: in a background tab rAF
    // is paused, so the intro waits for someone to look at it.
    frameId = requestAnimationFrame((now) => {
      startedAt = now
      frame(now)
    })
  }

  begin()
}

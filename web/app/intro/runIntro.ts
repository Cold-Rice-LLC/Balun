import Matter from 'matter-js'
import { INTRO_PIECES } from './pieces'

/**
 * The home intro, played on the server-rendered overlay (components/home/
 * Intro.vue) as plain DOM — started by plugins/intro.client.ts before the app
 * hydrates, so the drop doesn't wait on the page's data or components.
 *
 * The pieces fall from where the first frame drew them into a matter.js
 * world, settle on the floor, then pop: a beat of anticipation, a hard,
 * uneven blast with a shockwave and a shake, the pieces growing toward the
 * viewer as they fly, and a hole tearing open in the white sheet to reveal
 * the page. Pieces move by transform only — no layout per frame.
 */

// World
const STEP_MS = 1000 / 60
const GRAVITY = 1.6
const RESTITUTION = 0.45
const FRICTION = 0.05
const FRICTION_AIR = 0.01

// Settling: the pop fires once everything is on screen and nearly still for
// SETTLE_HOLD_MS, but never before MIN_DROP_MS (let the pile land) nor after
// MAX_DROP_MS (a piece that keeps rocking can't hold up the page).
const MIN_DROP_MS = 1300
const MAX_DROP_MS = 2300
const SETTLE_HOLD_MS = 250
const SETTLED_SPEED = 3

// The pop. Speeds are matter.js velocities (px per 60fps frame).
const ANTICIPATION_MS = 140
const ANTICIPATION_SCALE = 0.9
// A hard burst that drags to a drift (air resistance), under lighter
// gravity, so the flight reads instead of blinking off screen.
const POP_SPEED = 75
const POP_SPEED_JITTER = 0.3
const POP_DRAG = 0.06
const POP_GRAVITY = 0.5
const POP_LIFT = 20
const POP_SPIN = 0.5
const POP_GROWTH = 0.7
const POP_GROWTH_MS = 650
const REVEAL_MS = 700
// The hole is fully clear inside this share of its radius, feathered beyond.
const REVEAL_CLEAR = 0.8
const SHAKE_MS = 180
const SHAKE_PX = 14
const RING_MS = 550
const RING_COLOR = 'var(--color-purple)'
// After the reveal, while the last pieces fly off.
const FINISH_MS = 250

const easeInQuad = (t: number) => t * t
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

interface Piece {
  el: HTMLImageElement
  body: Matter.Body
  // Center of mass within the image box, for transform-origin.
  originX: number
  originY: number
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
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: 0 })
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05)
      Matter.Composite.add(engine.world, body)

      // From here on the body places it: pin the box to the corner and move
      // it by transform alone.
      el.style.left = '0'
      el.style.top = '0'
      el.style.transformOrigin = `${centre.x}px ${centre.y}px`
      return { el, body, originX: centre.x, originY: centre.y }
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
    pieces.every(({ body }) => body.bounds.min.y > 0 && body.speed < SETTLED_SPEED)

  const frame = (now: number) => {
    if (!root.isConnected) return
    // Real elapsed time, so the fall runs at the same speed on any refresh rate.
    // Stepped in ≤60fps slices, the most matter.js is stable at.
    let delta = lastFrame ? Math.min(now - lastFrame, 50) : STEP_MS
    lastFrame = now
    while (!paused && delta > 0) {
      Matter.Engine.update(engine, Math.min(delta, STEP_MS))
      delta -= STEP_MS
    }
    render(now)

    if (!popping) {
      const elapsed = now - startedAt
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

  const pop = async () => {
    popping = true

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
    engine.gravity.y = POP_GRAVITY
    for (const { body } of pieces) {
      body.frictionAir = POP_DRAG
      const dx = body.position.x - originX
      const dy = body.position.y - originY
      const distance = Math.hypot(dx, dy) || 1
      const speed = POP_SPEED * (1 + (Math.random() * 2 - 1) * POP_SPEED_JITTER)
      Matter.Body.setVelocity(body, {
        x: (dx / distance) * speed,
        y: (dy / distance) * speed - POP_LIFT,
      })
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * POP_SPIN * 2)
    }

    // The hole is sized so its fully clear band reaches the farthest corner.
    const radius = Math.hypot(Math.max(originX, width - originX), originY) / REVEAL_CLEAR
    shockwave(originX, originY, radius)
    shakeUntil = performance.now() + SHAKE_MS
    tween(POP_GROWTH_MS, easeOutCubic, (t) => {
      scale = ANTICIPATION_SCALE + POP_GROWTH * t
    })
    // Faded out by the time the overlay comes down, wherever they've got to.
    tween(REVEAL_MS + FINISH_MS, easeInQuad, (t) => {
      for (const { el } of pieces) el.style.opacity = `${1 - t}`
    })
    await tween(REVEAL_MS, easeOutExpo, (t) => {
      const r = radius * t
      const mask = `radial-gradient(circle ${r}px at ${originX}px ${originY}px, transparent 0%, transparent ${REVEAL_CLEAR * 100}%, black 100%)`
      sheet.style.maskImage = mask
      sheet.style.webkitMaskImage = mask
    })

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

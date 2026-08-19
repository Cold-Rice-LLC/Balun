import Matter from 'matter-js'
import type { Ref } from 'vue'

/**
 * matter.js world for the home-page intro (HomeIntro): bodies fall, settle
 * on a floor between two walls, then explode() launches everything off
 * screen. Ported from channelstudio/balun.
 *
 * Collision shapes are the real SVG silhouettes, not bounding boxes: each
 * SVG's paths are sampled at display scale and their convex hull becomes the
 * body, so letters and shoes tumble on their drawn edges.
 *
 * Client-only by construction (DOM sampling + rAF) — mount the consuming
 * component with the engine started only in the browser.
 */

export interface PhysicsBody {
  id: number
  src: string
  centerX: number // centroid position in world space
  centerY: number
  angle: number // rotation in radians
  width: number
  height: number
  centroidOffsetX: number // distance from image top-left to centroid
  centroidOffsetY: number
}

export interface PhysicsConfig {
  gravity: number
  restitution: number
  friction: number
  frictionAir: number
  explosionIntensity: number
}

/**
 * Fetches an SVG, samples points along all its paths at display scale, and
 * returns the convex hull of those points as the collision shape.
 */
const sampleSvgShape = async (src: string, displayWidth: number, displayHeight: number) => {
  const svgText = await fetch(src).then((response) => response.text())
  const parsedDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svgElement = parsedDoc.querySelector('svg')!
  const viewBox = svgElement.viewBox.baseVal

  // Scale factors from SVG viewBox coordinates to display pixel coordinates
  const scaleX = displayWidth / viewBox.width
  const scaleY = displayHeight / viewBox.height

  // getTotalLength / getPointAtLength need live DOM elements, so mount a
  // hidden SVG temporarily.
  const hiddenSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  Object.assign(hiddenSvg.style, { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', top: '0', left: '0' })
  hiddenSvg.setAttribute('viewBox', `0 0 ${viewBox.width} ${viewBox.height}`)
  document.body.appendChild(hiddenSvg)

  const sampledPoints: { x: number; y: number }[] = []

  try {
    parsedDoc.querySelectorAll('path').forEach((originalPath) => {
      const livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      livePath.setAttribute('d', originalPath.getAttribute('d') ?? '')
      hiddenSvg.appendChild(livePath)

      const pathLength = livePath.getTotalLength()
      // A point every ~10px along the path approximates the shape well
      const sampleCount = Math.ceil(pathLength / 10)
      for (let i = 0; i <= sampleCount; i++) {
        const svgPoint = livePath.getPointAtLength((i / sampleCount) * pathLength)
        sampledPoints.push({ x: svgPoint.x * scaleX, y: svgPoint.y * scaleY })
      }
    })
  } finally {
    document.body.removeChild(hiddenSvg)
  }

  return Matter.Vertices.hull(sampledPoints as unknown as Matter.Vertex[])
}

export const usePhysics = (containerWidth: Ref<number>, containerHeight: Ref<number>, config: PhysicsConfig) => {
  const engine = Matter.Engine.create()
  engine.gravity.y = config.gravity

  const bodies = ref<PhysicsBody[]>([])
  const matterBodies: Matter.Body[] = []

  // Display metadata per body id — Matter.js bodies don't carry display props
  const bodyMetaById = new Map<
    number,
    {
      src: string
      width: number
      height: number
      centroidOffsetX: number
      centroidOffsetY: number
    }
  >()

  let animationFrameId = 0
  let lastFrameTime = 0

  // Static boundary bodies — large enough to cover any viewport
  const floorBody = Matter.Bodies.rectangle(0, 0, 6000, 60, { isStatic: true, friction: 0.5 })
  const leftWallBody = Matter.Bodies.rectangle(0, 0, 60, 4000, { isStatic: true })
  const rightWallBody = Matter.Bodies.rectangle(0, 0, 60, 4000, { isStatic: true })
  Matter.Composite.add(engine.world, [floorBody, leftWallBody, rightWallBody])

  const positionBoundaries = () => {
    const width = containerWidth.value
    const height = containerHeight.value
    if (!width || !height) return
    Matter.Body.setPosition(floorBody, { x: width / 2, y: height + 30 })
    Matter.Body.setPosition(leftWallBody, { x: -30, y: height / 2 })
    Matter.Body.setPosition(rightWallBody, { x: width + 30, y: height / 2 })
  }

  // Keep boundaries in place as the container resizes
  watch([containerWidth, containerHeight], positionBoundaries, { immediate: true })

  const step = (frameTime: number) => {
    // Real elapsed time so physics runs at the same speed on any refresh rate
    const deltaMs = lastFrameTime ? Math.min(frameTime - lastFrameTime, 50) : 1000 / 60
    lastFrameTime = frameTime

    Matter.Engine.update(engine, deltaMs)

    // Sync Matter.js body state into the Vue reactive array for rendering
    bodies.value = matterBodies.map((matterBody) => {
      const meta = bodyMetaById.get(matterBody.id)!
      return {
        id: matterBody.id,
        src: meta.src,
        centerX: matterBody.position.x,
        centerY: matterBody.position.y,
        angle: matterBody.angle,
        width: meta.width,
        height: meta.height,
        centroidOffsetX: meta.centroidOffsetX,
        centroidOffsetY: meta.centroidOffsetY,
      }
    })

    animationFrameId = requestAnimationFrame(step)
  }

  const addBody = async (opts: {
    src: string
    x: number // image top-left x
    y: number // image top-left y
    vx: number
    vy: number
    width: number
    height: number
  }) => {
    // Default centroid = center of bounding box (rectangle-body fallback)
    let centroidOffsetX = opts.width / 2
    let centroidOffsetY = opts.height / 2
    let matterBody: Matter.Body

    try {
      const hullPoints = await sampleSvgShape(opts.src, opts.width, opts.height)
      if (hullPoints.length < 3) throw new Error('hull too small')

      // Centroid of the hull (average of all hull vertices)
      centroidOffsetX = hullPoints.reduce((sum, point) => sum + point.x, 0) / hullPoints.length
      centroidOffsetY = hullPoints.reduce((sum, point) => sum + point.y, 0) / hullPoints.length

      // Re-center vertices around the centroid (Matter.js expects centroid at origin)
      const centeredVertices = hullPoints.map((point) => ({
        x: point.x - centroidOffsetX,
        y: point.y - centroidOffsetY,
      }))

      // Place the body so its centroid lands at (image_left + offsetX, image_top + offsetY)
      matterBody = Matter.Bodies.fromVertices(opts.x + centroidOffsetX, opts.y + centroidOffsetY, [centeredVertices], {
        restitution: config.restitution,
        friction: config.friction,
        frictionAir: config.frictionAir,
      })
    } catch {
      // Fallback: plain rectangle if SVG parsing fails
      matterBody = Matter.Bodies.rectangle(opts.x + centroidOffsetX, opts.y + centroidOffsetY, opts.width, opts.height, {
        restitution: config.restitution,
        friction: config.friction,
        frictionAir: config.frictionAir,
      })
    }

    Matter.Body.setVelocity(matterBody, { x: opts.vx, y: opts.vy })
    // Small random spin so pieces tumble naturally as they fall
    Matter.Body.setAngularVelocity(matterBody, (Math.random() - 0.5) * 0.05)

    bodyMetaById.set(matterBody.id, {
      src: opts.src,
      width: opts.width,
      height: opts.height,
      centroidOffsetX,
      centroidOffsetY,
    })
    matterBodies.push(matterBody)
    Matter.Composite.add(engine.world, matterBody)
  }

  /**
   * Launches all bodies outward from a point with enough velocity to escape
   * the viewport, and moves the boundaries far away so nothing bounces back.
   */
  const explode = (originX: number, originY: number) => {
    // Pull the walls out of the way so bodies can fly off in all directions
    Matter.Body.setPosition(floorBody, { x: originX, y: containerHeight.value + 3000 })
    Matter.Body.setPosition(leftWallBody, { x: -3000, y: containerHeight.value / 2 })
    Matter.Body.setPosition(rightWallBody, { x: containerWidth.value + 3000, y: containerHeight.value / 2 })

    const launchSpeed = config.explosionIntensity

    for (const matterBody of matterBodies) {
      const dx = matterBody.position.x - originX
      const dy = matterBody.position.y - originY
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      // Add to existing velocity so resting and moving bodies both feel it
      Matter.Body.setVelocity(matterBody, {
        x: matterBody.velocity.x + (dx / distance) * launchSpeed,
        y: matterBody.velocity.y + (dy / distance) * launchSpeed,
      })

      // Crank up spin for a dramatic tumble
      Matter.Body.setAngularVelocity(matterBody, (Math.random() - 0.5) * 0.4)
    }
  }

  const start = () => {
    animationFrameId = requestAnimationFrame(step)
  }
  const stop = () => cancelAnimationFrame(animationFrameId)

  return { bodies, addBody, start, stop, explode }
}

import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, Mesh, type Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { FireDoorMaterials } from './materials'

/**
 * Puerta cortafuego procedural con escala arquitectónica real (metros).
 *
 * Jerarquía:
 *   FireDoorAssembly
 *   ├─ DoorFrame         (fijo: jambas, cabezal, topes, bisagras-parte fija, zapata del cierrapuertas)
 *   ├─ DoorLeafPivot     (único nodo que rota; su origen está EN el eje de las bisagras)
 *   │   ├─ DoorLeaf, InnerPanel, OuterPanel, PerimeterSeals
 *   │   ├─ PanicBar, DoorHandle, VisionPanel, KickPlate
 *   │   └─ Hinges (placas de la hoja), DoorCloser (cuerpo + eje)
 *   └─ DoorCloserArm     (eslabones resueltos por cinemática en cada ángulo)
 *
 * Convenciones del espacio local del ensamblaje: origen en el piso, al
 * centro del vano; la cara frontal del muro está en z = 0 y el muro se
 * extiende hacia −z. La hoja abre hacia −z (sentido de evacuación), por eso
 * el eje de bisagras está en la arista posterior y los topes al frente.
 */

export const WALL_THICKNESS = 0.25

export interface DoorSpec {
  readonly leafWidth: number
  readonly leafHeight: number
  readonly thickness: number
  readonly visionPanel: boolean
  readonly closer: boolean
  readonly panicBar: boolean
  readonly frame: boolean
  /** Detalle alto: geometrías redondeadas con más segmentos */
  readonly hero: boolean
}

export interface FireDoorAssembly {
  readonly root: Group
  readonly leafPivot: Group
  /** Ancho total del vano necesario en el muro (incluye jambas) */
  readonly openingWidth: number
  /** Altura total del vano necesario en el muro (incluye cabezal) */
  readonly openingHeight: number
  setAngle(radians: number): void
}

const GAP = 0.006
const JAMB_FACE = 0.11
const HEAD_HEIGHT = 0.1
const BOTTOM_CLEARANCE = 0.01
const LEAF_BACK_Z = -0.06
const STOP = 0.016

/** Caché de geometrías: todas las puertas con la misma especificación las comparten */
export class DoorGeometryCache {
  private readonly cache = new Map<string, BufferGeometry>()

  get(key: string, factory: () => BufferGeometry): BufferGeometry {
    const existing = this.cache.get(key)
    if (existing) return existing
    const created = factory()
    this.cache.set(key, created)
    return created
  }

  dispose(): void {
    for (const geometry of this.cache.values()) geometry.dispose()
    this.cache.clear()
  }
}

function box(cache: DoorGeometryCache, w: number, h: number, d: number): BufferGeometry {
  return cache.get(`box:${w.toFixed(4)}:${h.toFixed(4)}:${d.toFixed(4)}`, () => new BoxGeometry(w, h, d))
}

function rounded(cache: DoorGeometryCache, w: number, h: number, d: number, radius: number, hero: boolean): BufferGeometry {
  const segments = hero ? 3 : 1
  return cache.get(`rbox:${w.toFixed(4)}:${h.toFixed(4)}:${d.toFixed(4)}:${radius}:${segments}`, () =>
    hero || radius > 0.002 ? new RoundedBoxGeometry(w, h, d, segments, radius) : new BoxGeometry(w, h, d),
  )
}

function cylinder(cache: DoorGeometryCache, radius: number, height: number, hero: boolean): BufferGeometry {
  const segments = hero ? 20 : 10
  return cache.get(`cyl:${radius}:${height.toFixed(4)}:${segments}`, () => new CylinderGeometry(radius, radius, height, segments))
}

function place(parent: Group, geometry: BufferGeometry, material: Material, x: number, y: number, z: number, name?: string): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  if (name) mesh.name = name
  parent.add(mesh)
  return mesh
}

export function buildFireDoor(materials: FireDoorMaterials, cache: DoorGeometryCache, spec: DoorSpec): FireDoorAssembly {
  const W = spec.leafWidth
  const H = spec.leafHeight
  const T = spec.thickness
  const inner = W / 2 + GAP
  const hingeX = -W / 2
  const leafTop = BOTTOM_CLEARANCE + H
  const headBottom = leafTop + GAP + 0.006

  const root = new Group()
  root.name = 'FireDoorAssembly'

  // ------------------------------------------------------------- Marco
  const frame = new Group()
  frame.name = 'DoorFrame'
  root.add(frame)

  if (spec.frame) {
    const jambDepth = WALL_THICKNESS + 0.03
    const jambZ = -WALL_THICKNESS + jambDepth / 2
    const jambHeight = headBottom + HEAD_HEIGHT
    const jamb = box(cache, JAMB_FACE, jambHeight, jambDepth)
    place(frame, jamb, materials.frameSteel, -(inner + JAMB_FACE / 2), jambHeight / 2, jambZ, 'JambHinge')
    place(frame, jamb, materials.frameSteel, inner + JAMB_FACE / 2, jambHeight / 2, jambZ, 'JambLatch')
    place(frame, box(cache, 2 * (inner + JAMB_FACE), HEAD_HEIGHT, jambDepth), materials.frameSteel, 0, headBottom + HEAD_HEIGHT / 2, jambZ, 'Head')

    // Contramarco (moldura) sobre la cara del muro
    const flange = box(cache, 0.045, jambHeight + 0.045, 0.03)
    place(frame, flange, materials.frameSteel, -(inner + JAMB_FACE + 0.0225), (jambHeight + 0.045) / 2, 0.015)
    place(frame, flange, materials.frameSteel, inner + JAMB_FACE + 0.0225, (jambHeight + 0.045) / 2, 0.015)
    place(frame, box(cache, 2 * (inner + JAMB_FACE + 0.045), 0.045, 0.03), materials.frameSteel, 0, jambHeight + 0.0225, 0.015)

    // Topes frontales (la hoja abre hacia −z y asienta contra ellos)
    const stopZ = LEAF_BACK_Z + T + 0.012
    const stopSide = box(cache, STOP, headBottom, 0.024)
    place(frame, stopSide, materials.frameSteel, -inner + STOP / 2, headBottom / 2, stopZ)
    place(frame, stopSide, materials.frameSteel, inner - STOP / 2, headBottom / 2, stopZ)
    place(frame, box(cache, 2 * inner, STOP, 0.024), materials.frameSteel, 0, headBottom - STOP / 2, stopZ)

    // Umbral metálico
    place(frame, box(cache, 2 * inner, 0.006, WALL_THICKNESS), materials.brushedSteel, 0, 0.003, -WALL_THICKNESS / 2)
  }

  // ------------------------------------------------------------- Hoja
  const leafPivot = new Group()
  leafPivot.name = 'DoorLeafPivot'
  // El pivote está EXACTAMENTE en el eje vertical de las bisagras
  leafPivot.position.set(hingeX, 0, LEAF_BACK_Z)
  root.add(leafPivot)

  const leaf = new Mesh(rounded(cache, W, H, T, 0.004, spec.hero), materials.doorPaint)
  leaf.name = 'DoorLeaf'
  leaf.position.set(W / 2, BOTTOM_CLEARANCE + H / 2, T / 2)
  leafPivot.add(leaf)

  // Paneles estampados en ambas caras
  const skin = box(cache, W - 0.1, H - 0.14, 0.003)
  place(leafPivot, skin, materials.doorPaint, W / 2, BOTTOM_CLEARANCE + H / 2 + 0.01, T + 0.0015, 'OuterPanel')
  place(leafPivot, skin, materials.doorPaint, W / 2, BOTTOM_CLEARANCE + H / 2 + 0.01, -0.0015, 'InnerPanel')

  // Sellos perimetrales (canto de cierre, canto de bisagra y cabeza)
  const seals = new Group()
  seals.name = 'PerimeterSeals'
  leafPivot.add(seals)
  const sideSeal = box(cache, 0.003, H - 0.02, 0.016)
  place(seals, sideSeal, materials.seal, W + 0.0005, BOTTOM_CLEARANCE + H / 2, T / 2)
  place(seals, sideSeal, materials.seal, -0.0005, BOTTOM_CLEARANCE + H / 2, T / 2)
  place(seals, box(cache, W - 0.04, 0.003, 0.016), materials.seal, W / 2, leafTop + 0.0005, T / 2)

  // Placa de protección inferior
  place(leafPivot, box(cache, W - 0.06, 0.22, 0.0015), materials.brushedSteel, W / 2, 0.135, T + 0.003, 'KickPlate')

  if (spec.visionPanel) {
    const vision = new Group()
    vision.name = 'VisionPanel'
    leafPivot.add(vision)
    const vx = W * 0.64
    const vy = 1.5
    const vw = 0.15
    const vh = 0.42
    place(vision, box(cache, vw, vh, T + 0.002), materials.glass, vx, vy, T / 2)
    const barV = box(cache, 0.02, vh + 0.04, 0.008)
    const barH = box(cache, vw + 0.04, 0.02, 0.008)
    for (const z of [T + 0.004, -0.004]) {
      place(vision, barV, materials.frameSteel, vx - vw / 2 - 0.01, vy, z)
      place(vision, barV, materials.frameSteel, vx + vw / 2 + 0.01, vy, z)
      place(vision, barH, materials.frameSteel, vx, vy - vh / 2 - 0.01, z)
      place(vision, barH, materials.frameSteel, vx, vy + vh / 2 + 0.01, z)
    }
  }

  if (spec.panicBar) {
    const bar = new Group()
    bar.name = 'PanicBar'
    leafPivot.add(bar)
    const y = 1.0
    place(bar, rounded(cache, 0.07, 0.085, 0.05, 0.012, spec.hero), materials.brushedSteel, 0.11, y, T + 0.025)
    place(bar, rounded(cache, 0.66, 0.042, 0.03, 0.01, spec.hero), materials.brushedSteel, 0.47, y, T + 0.052)
    place(bar, rounded(cache, 0.16, 0.1, 0.07, 0.014, spec.hero), materials.brushedSteel, W - 0.105, y, T + 0.035)

    // Varillas verticales de enclavamiento superior e inferior
    const rodX = W - 0.06
    const upperLength = leafTop - 0.05 - (y + 0.05)
    const lowerLength = y - 0.05 - 0.05
    const upper = place(bar, cylinder(cache, 0.007, upperLength, spec.hero), materials.brushedSteel, rodX, y + 0.05 + upperLength / 2, T + 0.012)
    upper.name = 'UpperRod'
    place(bar, cylinder(cache, 0.007, lowerLength, spec.hero), materials.brushedSteel, rodX, 0.05 + lowerLength / 2, T + 0.012)
    const latch = box(cache, 0.05, 0.05, 0.03)
    place(bar, latch, materials.brushedSteel, rodX, leafTop - 0.035, T + 0.015)
    place(bar, latch, materials.brushedSteel, rodX, 0.06, T + 0.015)
    const guide = box(cache, 0.03, 0.02, 0.022)
    place(bar, guide, materials.brushedSteel, rodX, 1.65, T + 0.011)
    place(bar, guide, materials.brushedSteel, rodX, 0.45, T + 0.011)
  }

  // Manija de palanca en la cara posterior
  const handle = new Group()
  handle.name = 'DoorHandle'
  leafPivot.add(handle)
  const rose = place(handle, cylinder(cache, 0.028, 0.012, spec.hero), materials.brushedSteel, W - 0.08, 1.0, -0.006)
  rose.rotation.x = Math.PI / 2
  const neck = place(handle, cylinder(cache, 0.009, 0.045, spec.hero), materials.brushedSteel, W - 0.08, 1.0, -0.03)
  neck.rotation.x = Math.PI / 2
  place(handle, rounded(cache, 0.13, 0.02, 0.02, 0.008, spec.hero), materials.brushedSteel, W - 0.13, 1.0, -0.052)

  // Bisagras: nudillo sobre el eje (fijo, en el marco) + placa de hoja (gira) + placa de marco (fija)
  const hingeYs = [0.25, 1.08, leafTop - 0.24]
  const hinges = new Group()
  hinges.name = 'Hinges'
  frame.add(hinges)
  const knuckle = cylinder(cache, 0.0115, 0.052, spec.hero)
  const cap = cylinder(cache, 0.0085, 0.008, spec.hero)
  const leafPlate = box(cache, 0.003, 0.11, 0.04)
  const framePlate = box(cache, 0.003, 0.11, 0.04)
  for (const hy of hingeYs) {
    place(hinges, knuckle, materials.brushedSteel, hingeX, hy + 0.028, LEAF_BACK_Z)
    place(hinges, knuckle, materials.brushedSteel, hingeX, hy - 0.028, LEAF_BACK_Z)
    place(hinges, cap, materials.brushedSteel, hingeX, hy + 0.058, LEAF_BACK_Z)
    place(hinges, cap, materials.brushedSteel, hingeX, hy - 0.058, LEAF_BACK_Z)
    place(hinges, framePlate, materials.brushedSteel, -inner + 0.0015, hy, LEAF_BACK_Z + 0.022)
    place(leafPivot, leafPlate, materials.brushedSteel, -0.0015, hy, 0.022, 'HingeLeafPlate')
  }

  // ------------------------------------------------------- Cierrapuertas
  const SPINDLE_X = 0.2
  const SPINDLE_Z = T + 0.035
  const ARM_Y = leafTop - 0.012
  const LINK = 0.25
  const shoeX = hingeX + 0.42
  const shoeZ = LEAF_BACK_Z + T + 0.04

  let updateArm: (radians: number) => void = () => undefined

  if (spec.closer) {
    const closer = new Group()
    closer.name = 'DoorCloser'
    leafPivot.add(closer)
    place(closer, rounded(cache, 0.27, 0.065, 0.06, 0.012, spec.hero), materials.brushedSteel, SPINDLE_X + 0.11, leafTop - 0.07, T + 0.03, 'CloserBody')
    place(closer, cylinder(cache, 0.009, 0.05, spec.hero), materials.brushedSteel, SPINDLE_X, ARM_Y - 0.02, SPINDLE_Z)

    if (spec.frame) {
      place(frame, box(cache, 0.07, 0.035, 0.035), materials.brushedSteel, shoeX, headBottom - 0.0175, shoeZ, 'CloserShoe')
    }

    const arm = new Group()
    arm.name = 'DoorCloserArm'
    root.add(arm)

    const linkGeometry = cache.get(`link:${LINK}`, () => {
      const g = new BoxGeometry(LINK, 0.012, 0.02)
      g.translate(LINK / 2, 0, 0)
      return g
    })
    const linkA = new Group()
    const linkB = new Group()
    linkA.add(new Mesh(linkGeometry, materials.brushedSteel))
    linkB.add(new Mesh(linkGeometry, materials.brushedSteel))
    arm.add(linkA, linkB)
    const elbow = place(arm, cylinder(cache, 0.011, 0.03, spec.hero), materials.brushedSteel, 0, ARM_Y, 0)

    const pivotX = hingeX
    const pivotZ = LEAF_BACK_Z
    // Variables reutilizadas: cero allocations por frame
    updateArm = (radians: number) => {
      const c = Math.cos(radians)
      const s = Math.sin(radians)
      // Eje del cierrapuertas en el espacio del ensamblaje (rotación de la hoja sobre Y)
      const px = pivotX + SPINDLE_X * c + SPINDLE_Z * s
      const pz = pivotZ - SPINDLE_X * s + SPINDLE_Z * c
      const dx = shoeX - px
      const dz = shoeZ - pz
      const dist = Math.min(Math.hypot(dx, dz), LINK * 2 - 1e-4)
      const a = dist / 2
      const h = Math.sqrt(Math.max(LINK * LINK - a * a, 0))
      const ux = dx / (Math.hypot(dx, dz) || 1)
      const uz = dz / (Math.hypot(dx, dz) || 1)
      // Codo hacia el frente (lado de la cámara), continuo en todo el giro
      const jx = px + ux * a - uz * h
      const jz = pz + uz * a + ux * h

      linkA.position.set(px, ARM_Y, pz)
      linkA.rotation.y = Math.atan2(-(jz - pz), jx - px)
      linkB.position.set(jx, ARM_Y, jz)
      linkB.rotation.y = Math.atan2(-(shoeZ - jz), shoeX - jx)
      elbow.position.set(jx, ARM_Y, jz)
    }
  }

  const setAngle = (radians: number): void => {
    leafPivot.rotation.y = radians
    updateArm(radians)
  }
  setAngle(0)

  return {
    root,
    leafPivot,
    openingWidth: 2 * (inner + JAMB_FACE),
    openingHeight: headBottom + HEAD_HEIGHT,
    setAngle,
  }
}

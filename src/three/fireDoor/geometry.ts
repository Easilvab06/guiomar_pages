import { BoxGeometry, BufferGeometry, Mesh, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Metros que cubre una repetición de textura en muros y pisos */
export const WORLD_UV_SCALE = 2.4

export interface Bounds {
  readonly x0: number
  readonly x1: number
  readonly y0: number
  readonly y1: number
  readonly z0: number
  readonly z1: number
}

/**
 * Caja alineada a ejes con UV proyectadas en coordenadas de mundo
 * (proyección planar según la normal de cada cara). Así la textura de
 * concreto mantiene la escala real en cualquier muro, sin estirarse.
 */
export function worldBox(bounds: Bounds, uvScale = WORLD_UV_SCALE): BoxGeometry {
  const w = Math.max(Math.abs(bounds.x1 - bounds.x0), 1e-4)
  const h = Math.max(Math.abs(bounds.y1 - bounds.y0), 1e-4)
  const d = Math.max(Math.abs(bounds.z1 - bounds.z0), 1e-4)
  const geometry = new BoxGeometry(w, h, d)
  geometry.translate((bounds.x0 + bounds.x1) / 2, (bounds.y0 + bounds.y1) / 2, (bounds.z0 + bounds.z1) / 2)

  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < position.count; i++) {
    const px = position.getX(i)
    const py = position.getY(i)
    const pz = position.getZ(i)
    const nx = Math.abs(normal.getX(i))
    const ny = Math.abs(normal.getY(i))
    const nz = Math.abs(normal.getZ(i))
    if (nx >= ny && nx >= nz) uv.setXY(i, pz / uvScale, py / uvScale)
    else if (ny >= nx && ny >= nz) uv.setXY(i, px / uvScale, pz / uvScale)
    else uv.setXY(i, px / uvScale, py / uvScale)
  }
  uv.needsUpdate = true
  return geometry
}

/** Acumula cajas que comparten material y las fusiona en una sola malla */
export class GeometryBatch {
  private readonly parts: BufferGeometry[] = []

  box(bounds: Bounds, uvScale?: number): this {
    this.parts.push(worldBox(bounds, uvScale))
    return this
  }

  add(geometry: BufferGeometry): this {
    this.parts.push(geometry)
    return this
  }

  get size(): number {
    return this.parts.length
  }

  toMesh(material: Material, options: { castShadow?: boolean; receiveShadow?: boolean } = {}): Mesh | null {
    if (this.parts.length === 0) return null
    const merged = mergeGeometries(this.parts, false)
    for (const part of this.parts) part.dispose()
    this.parts.length = 0
    if (!merged) throw new Error('[GeometryBatch] no se pudieron fusionar las geometrías')
    const mesh = new Mesh(merged, material)
    mesh.castShadow = options.castShadow ?? false
    mesh.receiveShadow = options.receiveShadow ?? false
    mesh.matrixAutoUpdate = false
    mesh.updateMatrix()
    return mesh
  }

  addTo(parent: Object3D, material: Material, options: { castShadow?: boolean; receiveShadow?: boolean } = {}): void {
    const mesh = this.toMesh(material, options)
    if (mesh) parent.add(mesh)
  }
}

export interface Opening {
  /** Inicio y fin del vano sobre el eje del muro */
  readonly from: number
  readonly to: number
  /** Altura del dintel */
  readonly top: number
}

/**
 * Muro paralelo al eje Z (cara hacia ±X) con vanos. Genera los paños
 * macizos entre vanos y los dinteles sobre cada uno.
 */
export function wallAlongZ(
  batch: GeometryBatch,
  xFace: number,
  thickness: number,
  zFrom: number,
  zTo: number,
  height: number,
  openings: readonly Opening[] = [],
): void {
  const x0 = Math.min(xFace, xFace + thickness)
  const x1 = Math.max(xFace, xFace + thickness)
  const start = Math.min(zFrom, zTo)
  const end = Math.max(zFrom, zTo)
  const sorted = [...openings].sort((a, b) => Math.min(a.from, a.to) - Math.min(b.from, b.to))
  let cursor = start
  for (const opening of sorted) {
    const o0 = Math.min(opening.from, opening.to)
    const o1 = Math.max(opening.from, opening.to)
    if (o0 > cursor) batch.box({ x0, x1, y0: 0, y1: height, z0: cursor, z1: o0 })
    batch.box({ x0, x1, y0: opening.top, y1: height, z0: o0, z1: o1 })
    cursor = o1
  }
  if (cursor < end) batch.box({ x0, x1, y0: 0, y1: height, z0: cursor, z1: end })
}

/** Muro paralelo al eje X (cara hacia ±Z) con vanos */
export function wallAlongX(
  batch: GeometryBatch,
  zFace: number,
  thickness: number,
  xFrom: number,
  xTo: number,
  height: number,
  openings: readonly Opening[] = [],
): void {
  const z0 = Math.min(zFace, zFace + thickness)
  const z1 = Math.max(zFace, zFace + thickness)
  const start = Math.min(xFrom, xTo)
  const end = Math.max(xFrom, xTo)
  const sorted = [...openings].sort((a, b) => Math.min(a.from, a.to) - Math.min(b.from, b.to))
  let cursor = start
  for (const opening of sorted) {
    const o0 = Math.min(opening.from, opening.to)
    const o1 = Math.max(opening.from, opening.to)
    if (o0 > cursor) batch.box({ x0: cursor, x1: o0, y0: 0, y1: height, z0, z1 })
    batch.box({ x0: o0, x1: o1, y0: opening.top, y1: height, z0, z1 })
    cursor = o1
  }
  if (cursor < end) batch.box({ x0: cursor, x1: end, y0: 0, y1: height, z0, z1 })
}

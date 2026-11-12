import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  type ColorSpace,
} from 'three'

/**
 * Texturas procedurales tileables generadas una sola vez en CPU.
 * Evitan descargar mapas PBR y mantienen la estética de las imágenes
 * de referencia: concreto de encofrado con juntas y agujeros de tensores,
 * piso pulido y pintura electrostática con textura "piel de naranja".
 */

type Rng = () => number

function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ruido de valor periódico (tileable) con interpolación suave */
class TileableNoise {
  private readonly lattice: Float32Array
  private readonly size = 256

  constructor(seed: number) {
    const rng = mulberry32(seed)
    this.lattice = new Float32Array(this.size * this.size)
    for (let i = 0; i < this.lattice.length; i++) this.lattice[i] = rng()
  }

  private value(ix: number, iy: number, period: number): number {
    const x = ((ix % period) + period) % period
    const y = ((iy % period) + period) % period
    return this.lattice[(y % this.size) * this.size + (x % this.size)] ?? 0
  }

  sample(u: number, v: number, period: number): number {
    const x = u * period
    const y = v * period
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = x - x0
    const fy = y - y0
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = this.value(x0, y0, period)
    const b = this.value(x0 + 1, y0, period)
    const c = this.value(x0, y0 + 1, period)
    const d = this.value(x0 + 1, y0 + 1, period)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }

  fbm(u: number, v: number, basePeriod: number, octaves: number): number {
    let amplitude = 0.5
    let total = 0
    let norm = 0
    let period = basePeriod
    for (let o = 0; o < octaves; o++) {
      total += this.sample(u, v, period) * amplitude
      norm += amplitude
      amplitude *= 0.5
      period *= 2
    }
    return total / norm
  }
}

function makeTexture(data: Uint8Array, size: number, colorSpace: ColorSpace): DataTexture {
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.colorSpace = colorSpace
  texture.needsUpdate = true
  return texture
}

/** Normal map tangente a partir de un campo de alturas (Sobel, tileable) */
function heightToNormal(height: Float32Array, size: number, strength: number): Uint8Array {
  const out = new Uint8Array(size * size * 4)
  const h = (x: number, y: number): number => height[((y + size) % size) * size + ((x + size) % size)] ?? 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * strength
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      out[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255)
      out[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255)
      out[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255)
      out[i + 3] = 255
    }
  }
  return out
}

export interface PbrTextureSet {
  readonly map: DataTexture
  readonly roughnessMap: DataTexture
  readonly normalMap: DataTexture
}

/**
 * Concreto de encofrado. Una repetición = un tablero de 2.4 × 1.2 m:
 * juntas horizontales/verticales y agujeros de tensores en retícula.
 */
export function createConcreteTextures(size: number): PbrTextureSet {
  const noise = new TileableNoise(1337)
  const rng = mulberry32(7)
  const height = new Float32Array(size * size)
  const albedo = new Uint8Array(size * size * 4)
  const rough = new Uint8Array(size * size * 4)

  const holes: [number, number][] = []
  for (const hx of [0.125, 0.375, 0.625, 0.875]) {
    for (const hy of [0.25, 0.75]) holes.push([hx + (rng() - 0.5) * 0.01, hy + (rng() - 0.5) * 0.02])
  }
  const holeRadius = 0.012

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const large = noise.fbm(u, v, 3, 4)
      const fine = noise.fbm(u, v, 48, 3)
      const streak = noise.fbm(u * 0.25, v, 6, 3)
      let tone = 0.5 + (large - 0.5) * 0.5 + (fine - 0.5) * 0.12 + (streak - 0.5) * 0.18
      // El relieve solo proviene del encofrado (juntas y tensores): el ruido fino
      // en las normales produce destellos bajo luz rasante, así que queda en el color.
      let bump = 0

      const seamV = Math.min(u, 1 - u)
      const seamH = Math.min(Math.abs(v - 0.5), v, 1 - v)
      const seam = Math.min(seamV, seamH)
      if (seam < 0.0035) {
        tone -= 0.12
        bump -= 0.5
      } else if (seam < 0.008) {
        tone += 0.04
      }

      for (const [hx, hy] of holes) {
        const d = Math.hypot(u - hx, (v - hy) * 2)
        if (d < holeRadius) {
          tone -= 0.28 * (1 - d / holeRadius)
          bump -= 0.9 * (1 - d / holeRadius)
        } else if (d < holeRadius * 1.6) {
          tone -= 0.05
        }
      }

      height[y * size + x] = bump
      const c = Math.max(0, Math.min(1, tone))
      const i = (y * size + x) * 4
      albedo[i] = Math.round((0.38 + c * 0.3) * 255)
      albedo[i + 1] = Math.round((0.38 + c * 0.29) * 255)
      albedo[i + 2] = Math.round((0.37 + c * 0.27) * 255)
      albedo[i + 3] = 255
      const r = Math.round((0.88 + (0.5 - fine) * 0.16) * 255)
      rough[i] = r
      rough[i + 1] = r
      rough[i + 2] = r
      rough[i + 3] = 255
    }
  }

  return {
    map: makeTexture(albedo, size, SRGBColorSpace),
    roughnessMap: makeTexture(rough, size, NoColorSpace),
    normalMap: makeTexture(heightToNormal(height, size, 1.4), size, NoColorSpace),
  }
}

/** Concreto pulido para pisos: moteado suave y brillo variable */
export function createFloorTextures(size: number): PbrTextureSet {
  const noise = new TileableNoise(2024)
  const height = new Float32Array(size * size)
  const albedo = new Uint8Array(size * size * 4)
  const rough = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const cloud = noise.fbm(u, v, 4, 5)
      const speck = noise.sample(u, v, 128)
      const tone = 0.3 + (cloud - 0.5) * 0.35 + (speck > 0.82 ? 0.08 : 0)
      height[y * size + x] = cloud * 0.08 + speck * 0.02
      const i = (y * size + x) * 4
      const c = Math.max(0, Math.min(1, tone))
      albedo[i] = Math.round((0.16 + c * 0.32) * 255)
      albedo[i + 1] = Math.round((0.16 + c * 0.31) * 255)
      albedo[i + 2] = Math.round((0.16 + c * 0.3) * 255)
      albedo[i + 3] = 255
      const r = Math.round((0.22 + (1 - cloud) * 0.32) * 255)
      rough[i] = r
      rough[i + 1] = r
      rough[i + 2] = r
      rough[i + 3] = 255
    }
  }

  return {
    map: makeTexture(albedo, size, SRGBColorSpace),
    roughnessMap: makeTexture(rough, size, NoColorSpace),
    normalMap: makeTexture(heightToNormal(height, size, 0.8), size, NoColorSpace),
  }
}

/** Pintura electrostática: "piel de naranja" fina y leves marcas de uso */
export function createPaintTextures(size: number): Omit<PbrTextureSet, 'map'> {
  const noise = new TileableNoise(99)
  const height = new Float32Array(size * size)
  const rough = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const peel = noise.fbm(u, v, 64, 2)
      const wear = noise.fbm(u, v, 5, 4)
      height[y * size + x] = peel
      const i = (y * size + x) * 4
      const r = Math.round((0.42 + (wear - 0.5) * 0.3 + (peel - 0.5) * 0.08) * 255)
      rough[i] = r
      rough[i + 1] = r
      rough[i + 2] = r
      rough[i + 3] = 255
    }
  }

  return {
    roughnessMap: makeTexture(rough, size, NoColorSpace),
    normalMap: makeTexture(heightToNormal(height, size, 0.25), size, NoColorSpace),
  }
}

/** Mancha de luz radial para simular la luz que se derrama sobre el piso */
export function createGlowTexture(size: number): DataTexture {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / (size - 1)) * 2 - 1
      const v = (y / (size - 1)) * 2 - 1
      const d = Math.min(1, Math.hypot(u, v))
      const a = Math.pow(1 - d, 2.2)
      const i = (y * size + x) * 4
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.round(a * 255)
    }
  }
  const texture = makeTexture(data, size, NoColorSpace)
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  return texture
}

/** Vidrio armado de la mirilla: retícula metálica sobre fondo oscuro */
export function createWireGlassTexture(size: number): DataTexture {
  const data = new Uint8Array(size * size * 4)
  const cell = size / 8
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x + y) % cell
      const gy = (x - y + size) % cell
      const wire = gx < 1.2 || gy < 1.2
      const i = (y * size + x) * 4
      const c = wire ? 120 : 22
      data[i] = c
      data[i + 1] = c
      data[i + 2] = c + (wire ? 0 : 6)
      data[i + 3] = 255
    }
  }
  return makeTexture(data, size, SRGBColorSpace)
}

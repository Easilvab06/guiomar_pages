import { CatmullRomCurve3, Vector3 } from 'three'
import type { FireDoorQuality } from '@/types/fireDoor'
import { MonotoneCurve } from './motion'

/**
 * Travelling cinematográfico: la cámara recorre una curva Catmull-Rom
 * (centrípeta: sin bucles ni sobrepasos en esquinas) mientras mira a lo
 * largo de una segunda curva de objetivos con el mismo número de puntos.
 * En cada punto de control i, la cámara está en P[i] mirando a L[i]; entre
 * puntos ambas curvas se interpolan con el mismo parámetro, por lo que la
 * orientación cambia de forma continua y sin giros bruscos.
 *
 * El progreso global se convierte en posición sobre la curva con una
 * interpolación monótona por fotogramas clave (progreso → punto de control),
 * de modo que cada capítulo ocurre en el lugar arquitectónico correcto.
 */

interface RigKey {
  readonly position: readonly [number, number, number]
  readonly look: readonly [number, number, number]
  /** Progreso global en el que la cámara alcanza este punto (null = interpolado) */
  readonly progress: number | null
}

const DESKTOP_KEYS: readonly RigKey[] = [
  { position: [0, 1.38, 5.4], look: [0, 1.12, 0], progress: 0 },
  { position: [0.05, 1.42, 3.5], look: [0, 1.18, -1], progress: 0.12 },
  { position: [0.12, 1.5, 1.5], look: [0.04, 1.32, -4], progress: 0.2 },
  { position: [0.16, 1.56, -0.9], look: [0.05, 1.5, -8], progress: 0.3 },
  { position: [0.08, 1.58, -4.2], look: [0, 1.55, -12], progress: 0.37 },
  { position: [0, 1.6, -7.6], look: [0.15, 1.55, -15], progress: 0.43 },
  { position: [0, 1.6, -11.4], look: [0.8, 1.55, -15.6], progress: 0.5 },
  { position: [-0.4, 1.6, -14.4], look: [5, 1.55, -15.7], progress: 0.56 },
  { position: [2.2, 1.6, -15.7], look: [9, 1.6, -15.6], progress: 0.63 },
  { position: [5, 1.62, -15.65], look: [13, 1.7, -15.6], progress: 0.71 },
  { position: [8.8, 1.66, -15.6], look: [17, 2.0, -15.6], progress: 0.8 },
  { position: [13.2, 1.9, -15.6], look: [23, 2.4, -15.5], progress: 0.9 },
  { position: [20.2, 1.85, -15.55], look: [26, 1.7, -15.6], progress: 1 },
]

/** Recorrido simplificado para pantallas pequeñas: menos curvas, termina al entrar al atrio */
const MOBILE_KEYS: readonly RigKey[] = [
  { position: [0, 1.4, 6.2], look: [0, 1.12, 0], progress: 0 },
  { position: [0.08, 1.45, 2.6], look: [0, 1.25, -2], progress: 0.17 },
  { position: [0.16, 1.56, -0.9], look: [0.05, 1.5, -8], progress: 0.3 },
  { position: [0, 1.6, -7.6], look: [0.15, 1.55, -15], progress: 0.45 },
  { position: [-0.4, 1.6, -14.4], look: [5, 1.55, -15.7], progress: 0.6 },
  { position: [4.6, 1.62, -15.65], look: [12, 1.7, -15.6], progress: 0.76 },
  { position: [11.2, 1.85, -15.6], look: [22, 2.4, -15.4], progress: 1 },
]

export class CameraRig {
  private readonly positions: CatmullRomCurve3
  private readonly looks: CatmullRomCurve3
  private readonly progressToParam: MonotoneCurve

  constructor(quality: FireDoorQuality) {
    const keys = quality === 'high' ? DESKTOP_KEYS : MOBILE_KEYS
    this.positions = new CatmullRomCurve3(
      keys.map((k) => new Vector3(...k.position)),
      false,
      'centripetal',
    )
    this.looks = new CatmullRomCurve3(
      keys.map((k) => new Vector3(...k.look)),
      false,
      'centripetal',
    )
    const last = keys.length - 1
    this.progressToParam = new MonotoneCurve(
      keys.flatMap((k, i): [number, number][] => (k.progress === null ? [] : [[k.progress, i / last]])),
    )
  }

  /** Escribe posición y objetivo en vectores existentes (sin allocations) */
  evaluate(progress: number, outPosition: Vector3, outLook: Vector3): void {
    const t = Math.min(Math.max(this.progressToParam.evaluate(progress), 0), 1)
    this.positions.getPoint(t, outPosition)
    this.looks.getPoint(t, outLook)
  }
}

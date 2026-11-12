/**
 * Funciones puras de movimiento compartidas por scroll, cámara y puerta.
 * Sin dependencias de Three.js ni del DOM: se pueden probar de forma aislada.
 */

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export function remap01(value: number, from: number, to: number): number {
  return clamp01((value - from) / (to - from))
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Amortiguación exponencial independiente del frame rate */
export function damp(current: number, target: number, lambda: number, deltaSeconds: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * deltaSeconds))
}

/**
 * Interpolación cúbica monótona (Fritsch–Carlson / PCHIP) a través de
 * fotogramas clave. A diferencia de encadenar easings, la velocidad es
 * continua en cada punto clave: la puerta acelera y desacelera con inercia
 * sin detenerse en cada hito, y nunca "rebota" por encima de un valor.
 */
export class MonotoneCurve {
  private readonly xs: Float64Array
  private readonly ys: Float64Array
  private readonly ms: Float64Array

  constructor(points: readonly (readonly [number, number])[]) {
    const n = points.length
    if (n < 2) throw new Error('[MonotoneCurve] se requieren al menos dos puntos')
    this.xs = new Float64Array(n)
    this.ys = new Float64Array(n)
    this.ms = new Float64Array(n)

    points.forEach(([x, y], i) => {
      this.xs[i] = x
      this.ys[i] = y
    })

    const deltas = new Float64Array(n - 1)
    for (let i = 0; i < n - 1; i++) {
      const dx = this.at(this.xs, i + 1) - this.at(this.xs, i)
      if (dx <= 0) throw new Error('[MonotoneCurve] las x deben ser estrictamente crecientes')
      deltas[i] = (this.at(this.ys, i + 1) - this.at(this.ys, i)) / dx
    }

    this.ms[0] = this.at(deltas, 0)
    this.ms[n - 1] = this.at(deltas, n - 2)
    for (let i = 1; i < n - 1; i++) {
      const d0 = this.at(deltas, i - 1)
      const d1 = this.at(deltas, i)
      this.ms[i] = d0 * d1 <= 0 ? 0 : (d0 + d1) / 2
    }

    for (let i = 0; i < n - 1; i++) {
      const d = this.at(deltas, i)
      if (d === 0) {
        this.ms[i] = 0
        this.ms[i + 1] = 0
        continue
      }
      const a = this.at(this.ms, i) / d
      const b = this.at(this.ms, i + 1) / d
      const h = a * a + b * b
      if (h > 9) {
        const t = 3 / Math.sqrt(h)
        this.ms[i] = t * a * d
        this.ms[i + 1] = t * b * d
      }
    }
  }

  private at(array: Float64Array, index: number): number {
    return array[index] ?? 0
  }

  evaluate(x: number): number {
    const n = this.xs.length
    const first = this.at(this.xs, 0)
    const last = this.at(this.xs, n - 1)
    if (x <= first) return this.at(this.ys, 0)
    if (x >= last) return this.at(this.ys, n - 1)

    let i = 0
    while (i < n - 2 && x > this.at(this.xs, i + 1)) i++

    const x0 = this.at(this.xs, i)
    const x1 = this.at(this.xs, i + 1)
    const h = x1 - x0
    const t = (x - x0) / h
    const t2 = t * t
    const t3 = t2 * t

    return (
      (2 * t3 - 3 * t2 + 1) * this.at(this.ys, i) +
      (t3 - 2 * t2 + t) * h * this.at(this.ms, i) +
      (-2 * t3 + 3 * t2) * this.at(this.ys, i + 1) +
      (t3 - t2) * h * this.at(this.ms, i + 1)
    )
  }
}

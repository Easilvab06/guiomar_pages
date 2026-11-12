import Lenis from 'lenis'
import type { LenisOptions, ScrollToOptions as LenisScrollToOptions } from 'lenis'
import { inject, onMounted, onUnmounted, provide, type InjectionKey } from 'vue'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/utils/gsap'

export type ScrollTarget = number | string | HTMLElement

export interface SmoothScrollConfig {
  readonly lenis?: Omit<LenisOptions, 'autoRaf'>
  /** Desactiva Lenis (scroll nativo) cuando el usuario pide movimiento reducido */
  readonly respectReducedMotion?: boolean
}

type ScrollListener = (state: { scroll: number; velocity: number; direction: 1 | -1 | 0 }) => void

const DEFAULT_LENIS_OPTIONS: Omit<LenisOptions, 'autoRaf'> = {
  lerp: 0.09,
  wheelMultiplier: 1,
  touchMultiplier: 1.4,
  smoothWheel: true,
  syncTouch: false,
}

/**
 * Orquesta Lenis + GSAP ScrollTrigger sobre un único bucle de animación.
 *
 * - Lenis NO crea su propio requestAnimationFrame (`autoRaf: false`): se
 *   alimenta desde `gsap.ticker`, que ya corre sobre rAF. Un solo bucle por
 *   frame evita el desfase de un frame entre la posición de scroll y las
 *   animaciones (el origen típico del "jank").
 * - `lagSmoothing(0)` impide que GSAP compense saltos de tiempo (pestaña en
 *   segundo plano), lo que desincronizaría Lenis y ScrollTrigger.
 * - Cada evento de scroll de Lenis invoca `ScrollTrigger.update()` en el
 *   mismo frame.
 */
export class SmoothScroll {
  private lenis: Lenis | null = null
  private readonly config: SmoothScrollConfig
  private readonly listeners = new Set<ScrollListener>()
  private nativeScrollAttached = false
  private lastNativeScroll = 0
  private destroyed = false

  constructor(config: SmoothScrollConfig = {}) {
    this.config = config
  }

  private readonly tick = (time: number): void => {
    // gsap.ticker entrega segundos; Lenis espera milisegundos
    this.lenis?.raf(time * 1000)
  }

  private readonly onLenisScroll = (instance: Lenis): void => {
    ScrollTrigger.update()
    this.emit(instance.scroll, instance.velocity, instance.direction)
  }

  private readonly onNativeScroll = (): void => {
    const scroll = window.scrollY
    const delta = scroll - this.lastNativeScroll
    this.lastNativeScroll = scroll
    this.emit(scroll, delta, delta > 0 ? 1 : delta < 0 ? -1 : 0)
  }

  private readonly refresh = (): void => {
    if (!this.destroyed) ScrollTrigger.refresh()
  }

  private emit(scroll: number, velocity: number, direction: number): void {
    const dir: 1 | -1 | 0 = direction > 0 ? 1 : direction < 0 ? -1 : 0
    for (const listener of this.listeners) listener({ scroll, velocity, direction: dir })
  }

  get instance(): Lenis | null {
    return this.lenis
  }

  get isSmooth(): boolean {
    return this.lenis !== null
  }

  init(): void {
    if (this.lenis || this.nativeScrollAttached || this.destroyed) return

    const useNative = (this.config.respectReducedMotion ?? true) && prefersReducedMotion()

    if (useNative) {
      window.addEventListener('scroll', this.onNativeScroll, { passive: true })
      this.nativeScrollAttached = true
    } else {
      this.lenis = new Lenis({ ...DEFAULT_LENIS_OPTIONS, ...this.config.lenis, autoRaf: false })
      this.lenis.on('scroll', this.onLenisScroll)
      gsap.ticker.add(this.tick)
      gsap.ticker.lagSmoothing(0)
    }

    // Las fuentes web y las imágenes cambian la altura del documento:
    // se recalculan los triggers cuando terminan de cargar.
    void document.fonts.ready.then(this.refresh)
    window.addEventListener('load', this.refresh, { once: true })
  }

  onScroll(listener: ScrollListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  scrollTo(target: ScrollTarget, options: LenisScrollToOptions = {}): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), ...options })
      return
    }
    const offset = options.offset ?? 0
    let top = 0
    if (typeof target === 'number') {
      top = target
    } else {
      const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
      if (!el) return
      top = el.getBoundingClientRect().top + window.scrollY
    }
    window.scrollTo({ top: top + offset, behavior: options.immediate ? 'instant' : 'smooth' })
  }

  stop(): void {
    if (this.lenis) this.lenis.stop()
    else document.documentElement.style.overflow = 'hidden'
  }

  start(): void {
    if (this.lenis) this.lenis.start()
    else document.documentElement.style.removeProperty('overflow')
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    if (this.lenis) {
      gsap.ticker.remove(this.tick)
      this.lenis.off('scroll', this.onLenisScroll)
      this.lenis.destroy()
      this.lenis = null
      // Restaura el valor por defecto de GSAP (500ms / 33ms)
      gsap.ticker.lagSmoothing(500, 33)
    }
    if (this.nativeScrollAttached) {
      window.removeEventListener('scroll', this.onNativeScroll)
      this.nativeScrollAttached = false
    }
    window.removeEventListener('load', this.refresh)
    document.documentElement.style.removeProperty('overflow')
    this.listeners.clear()
  }
}

export const SMOOTH_SCROLL_KEY: InjectionKey<SmoothScroll> = Symbol('SmoothScroll')

/**
 * Crea y provee la instancia en el componente raíz. Su ciclo de vida queda
 * atado al del proveedor: al desmontarse se destruye Lenis y se eliminan
 * todos los ScrollTriggers restantes (red de seguridad global).
 */
export function provideSmoothScroll(config: SmoothScrollConfig = {}): SmoothScroll {
  const smooth = new SmoothScroll(config)
  provide(SMOOTH_SCROLL_KEY, smooth)

  onMounted(() => {
    smooth.init()
  })

  onUnmounted(() => {
    smooth.destroy()
    ScrollTrigger.killAll()
  })

  return smooth
}

export function useSmoothScroll(): SmoothScroll {
  const smooth = inject(SMOOTH_SCROLL_KEY, null)
  if (!smooth) {
    throw new Error('[smoothScroll] useSmoothScroll() requiere provideSmoothScroll() en un ancestro.')
  }
  return smooth
}

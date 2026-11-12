import { onMounted, onUnmounted, readonly, ref, watch, type DeepReadonly, type Ref } from 'vue'
import { gsap, ScrollTrigger } from '@/utils/gsap'
import { useSmoothScroll } from '@/utils/smoothScroll'
import { damp } from '@/three/fireDoor/motion'
import type { FireDoorChapter, FireDoorProgressState } from '@/types/fireDoor'

export interface FireDoorScrollOptions {
  readonly chapters: readonly FireDoorChapter[]
  /** Activa la experiencia por scroll (false en modo estático) */
  readonly enabled: Readonly<Ref<boolean>>
  /**
   * Se invoca en cada frame del bucle único mientras la experiencia está en
   * pantalla. `changed` indica si el progreso suavizado se movió.
   */
  readonly onFrame: (state: Readonly<FireDoorProgressState>, changed: boolean) => void
  /** Rigidez del suavizado (1/s). Alto = más pegado al scroll */
  readonly stiffness?: number
}

export interface FireDoorScrollController {
  readonly state: Readonly<FireDoorProgressState>
  readonly activeIndex: DeepReadonly<Ref<number>>
  readonly percent: DeepReadonly<Ref<number>>
  /** Progreso local (0..1) dentro de un capítulo */
  chapterLocal(index: number, progress: number): number
  scrollToProgress(progress: number): void
  scrollToChapter(index: number): void
}

/** Punto del capítulo en el que su texto ya es completamente legible */
const CHAPTER_ENTRY = 0.22
const SETTLE_EPSILON = 1e-4

/**
 * Fuente ÚNICA de progreso de la experiencia.
 *
 * - Un solo ScrollTrigger (sin pin: el escenario usa `position: sticky`)
 *   mide el avance del contenedor de ~5 pantallas y escribe `state.target`.
 * - Un solo callback en `gsap.ticker` (el mismo bucle que ya alimenta a
 *   Lenis) amortigua `state.current` hacia el objetivo y notifica a escena y
 *   HUD. No hay timelines con autoplay: todo deriva del scroll, por lo que la
 *   puerta se detiene cuando el scroll se detiene y se cierra al retroceder.
 * - El bucle solo corre con la experiencia en pantalla y la pestaña visible.
 * - La navegación por capítulos mueve el scroll real (Lenis), nunca la
 *   cámara directamente: no existen dos fuentes de verdad.
 */
export function useFireDoorScroll(
  trackRef: Readonly<Ref<HTMLElement | null>>,
  options: FireDoorScrollOptions,
): FireDoorScrollController {
  const smooth = useSmoothScroll()
  const state: FireDoorProgressState = { target: 0, current: 0 }
  const activeIndex = ref(0)
  const percent = ref(0)
  const stiffness = options.stiffness ?? 9

  let trigger: ScrollTrigger | null = null
  let observer: IntersectionObserver | null = null
  let inView = false
  let pageVisible = !document.hidden
  let ticking = false

  function chapterIndexFor(progress: number): number {
    const chapters = options.chapters
    for (let i = chapters.length - 1; i >= 0; i--) {
      const chapter = chapters[i]
      if (chapter && progress >= chapter.start) return i
    }
    return 0
  }

  function chapterLocal(index: number, progress: number): number {
    const chapter = options.chapters[index]
    if (!chapter) return 0
    return Math.min(Math.max((progress - chapter.start) / (chapter.end - chapter.start), 0), 1)
  }

  function syncDiscrete(): void {
    const index = chapterIndexFor(state.current)
    if (index !== activeIndex.value) activeIndex.value = index
    const pct = Math.round(state.current * 100)
    if (pct !== percent.value) percent.value = pct
  }

  const tick = (_time: number, deltaMs: number): void => {
    const before = state.current
    const dt = Math.min(deltaMs, 50) / 1000
    state.current = damp(state.current, state.target, stiffness, dt)
    if (Math.abs(state.target - state.current) < SETTLE_EPSILON) state.current = state.target
    const changed = state.current !== before
    if (changed) syncDiscrete()
    options.onFrame(state, changed)
  }

  function syncTicker(): void {
    const shouldTick = options.enabled.value && inView && pageVisible && trigger !== null
    if (shouldTick && !ticking) {
      // Al (re)entrar no se reproduce un recorrido pendiente: se parte del scroll real
      state.current = state.target
      syncDiscrete()
      options.onFrame(state, true)
      gsap.ticker.add(tick)
      ticking = true
    } else if (!shouldTick && ticking) {
      gsap.ticker.remove(tick)
      ticking = false
    }
  }

  function onVisibilityChange(): void {
    pageVisible = !document.hidden
    syncTicker()
  }

  function createTrigger(): void {
    const track = trackRef.value
    if (!track || trigger) return
    trigger = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        state.target = self.progress
      },
      onRefresh: (self) => {
        state.target = self.progress
      },
    })
    state.target = trigger.progress
    state.current = state.target
    syncDiscrete()

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        inView = entry?.isIntersecting ?? false
        syncTicker()
      },
      { rootMargin: '10% 0px' },
    )
    observer.observe(track)
  }

  function destroyTrigger(): void {
    if (ticking) {
      gsap.ticker.remove(tick)
      ticking = false
    }
    observer?.disconnect()
    observer = null
    inView = false
    trigger?.kill()
    trigger = null
  }

  function scrollToProgress(progress: number): void {
    if (!trigger) return
    const clamped = Math.min(Math.max(progress, 0), 1)
    const y = trigger.start + clamped * (trigger.end - trigger.start)
    smooth.scrollTo(y, { duration: 1.6 })
  }

  function scrollToChapter(index: number): void {
    const chapter = options.chapters[index]
    if (!chapter) return
    const entry = index === 0 ? 0 : chapter.start + (chapter.end - chapter.start) * CHAPTER_ENTRY
    scrollToProgress(entry)
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (options.enabled.value) createTrigger()
  })

  // Cambio de modo en caliente (p. ej. WebGL falla): se crea/destruye el trigger
  watch(
    options.enabled,
    (enabled) => {
      if (enabled) createTrigger()
      else destroyTrigger()
      ScrollTrigger.refresh()
    },
    { flush: 'post' },
  )

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    destroyTrigger()
  })

  return {
    state,
    activeIndex: readonly(activeIndex),
    percent: readonly(percent),
    chapterLocal,
    scrollToProgress,
    scrollToChapter,
  }
}

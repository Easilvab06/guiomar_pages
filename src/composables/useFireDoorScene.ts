import { onMounted, onUnmounted, readonly, ref, type DeepReadonly, type Ref } from 'vue'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace, WebGLRenderer } from 'three'
import { createFireDoorWorld, type FireDoorWorld } from '@/three/fireDoor/world'
import type { FireDoorQuality } from '@/types/fireDoor'

export interface FireDoorSceneOptions {
  readonly quality: FireDoorQuality
  readonly onReady?: () => void
  readonly onFallback?: (reason: string) => void
}

export interface FireDoorSceneController {
  readonly ready: DeepReadonly<Ref<boolean>>
  /**
   * Aplica el progreso y renderiza SOLO si algo cambió (progreso, tamaño o
   * contexto restaurado). Lo invoca el bucle único de la experiencia.
   */
  render(progress: number): void
}

const PIXEL_RATIO_CAP: Record<FireDoorQuality, number> = { high: 1.75, low: 1.25 }
const PROGRESS_EPSILON = 1e-5

/**
 * Ciclo de vida completo de la instancia Three.js de la experiencia:
 * creación del renderer, construcción del mundo, redimensionado con
 * ResizeObserver, pérdida/restauración de contexto y liberación total.
 * No registra bucles propios: el render lo dispara `useFireDoorScroll`.
 */
export function useFireDoorScene(
  canvasRef: Readonly<Ref<HTMLCanvasElement | null>>,
  containerRef: Readonly<Ref<HTMLElement | null>>,
  options: FireDoorSceneOptions,
): FireDoorSceneController {
  const ready = ref(false)

  let renderer: WebGLRenderer | null = null
  let world: FireDoorWorld | null = null
  let resizeObserver: ResizeObserver | null = null
  let contextLost = false
  let dirty = true
  let lastProgress = Number.NaN

  function onContextLost(event: Event): void {
    event.preventDefault()
    contextLost = true
  }

  function onContextRestored(): void {
    contextLost = false
    dirty = true
  }

  function resize(): void {
    const container = containerRef.value
    if (!container || !renderer || !world) return
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP[options.quality]))
    renderer.setSize(width, height, false)
    world.resize(width, height)
    dirty = true
  }

  function render(progress: number): void {
    if (!renderer || !world || contextLost) return
    if (!dirty && Math.abs(progress - lastProgress) < PROGRESS_EPSILON) return
    world.update(progress)
    renderer.render(world.scene, world.camera)
    lastProgress = progress
    dirty = false
  }

  function supportsWebGL2(): boolean {
    try {
      return document.createElement('canvas').getContext('webgl2') !== null
    } catch {
      return false
    }
  }

  onMounted(() => {
    const canvas = canvasRef.value
    const container = containerRef.value
    if (!canvas || !container) return

    if (!supportsWebGL2()) {
      options.onFallback?.('webgl2-unavailable')
      return
    }

    try {
      renderer = new WebGLRenderer({
        canvas,
        antialias: options.quality === 'high',
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      })
    } catch (error) {
      options.onFallback?.(error instanceof Error ? error.message : 'renderer-error')
      return
    }

    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = options.quality === 'high'
    renderer.shadowMap.type = PCFShadowMap

    try {
      world = createFireDoorWorld(renderer, options.quality)
    } catch (error) {
      renderer.dispose()
      renderer.forceContextLoss()
      renderer = null
      options.onFallback?.(error instanceof Error ? error.message : 'scene-error')
      return
    }

    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    // Precompila los programas antes del primer frame visible
    world.update(0)
    renderer.compile(world.scene, world.camera)
    render(0)

    ready.value = true
    options.onReady?.()
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null

    const canvas = renderer?.domElement
    canvas?.removeEventListener('webglcontextlost', onContextLost)
    canvas?.removeEventListener('webglcontextrestored', onContextRestored)

    world?.dispose()
    world = null

    if (renderer) {
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer = null
    }
    ready.value = false
  })

  return { ready: readonly(ready), render }
}

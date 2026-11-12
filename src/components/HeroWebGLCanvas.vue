<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
  type IUniform,
} from 'three'
import { gsap, prefersReducedMotion } from '@/utils/gsap'
import vertexShader from '@/shaders/vertex.glsl?raw'
import fragmentShader from '@/shaders/fragment.glsl?raw'

interface Props {
  /** Amplitud base de los pliegues */
  amplitude?: number
  /** Velocidad del lerp del cursor (0..1 por frame a 60 FPS) */
  mouseEase?: number
  maxPixelRatio?: number
}

const props = withDefaults(defineProps<Props>(), {
  amplitude: 0.55,
  mouseEase: 0.075,
  maxPixelRatio: 1.75,
})

const emit = defineEmits<{
  ready: []
  fallback: [reason: string]
}>()

interface SilkUniforms {
  [uniform: string]: IUniform
  uTime: IUniform<number>
  uMouse: IUniform<Vector2>
  uMouseStrength: IUniform<number>
  uProgress: IUniform<number>
  uPlaneSize: IUniform<Vector2>
  uAmplitude: IUniform<number>
  uColorDeep: IUniform<Color>
  uColorMid: IUniform<Color>
  uColorHot: IUniform<Color>
  uColorSheen: IUniform<Color>
}

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isReady = ref(false)

// Estado no reactivo: Three.js nunca debe envolverse en proxies de Vue
let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let geometry: PlaneGeometry | null = null
let material: ShaderMaterial | null = null
let mesh: Mesh<PlaneGeometry, ShaderMaterial> | null = null
let uniforms: SilkUniforms | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
// Timer (sucesor de Clock en r18x): acumula tiempo solo mientras se renderiza
const timer = new Timer()

let isVisible = true
let isPageVisible = !document.hidden
let isContextLost = false
let isTicking = false
let reducedMotion = false
let currentSegments = 0

// Puntero: objetivo (crudo) y actual (suavizado con lerp)
const pointerTarget = new Vector2(0.15, 0.1)
const pointerCurrent = new Vector2(0.15, 0.1)
const lastPointer = new Vector2(0, 0)
let pointerSpeed = 0
let strengthTarget = 0.35
let containerRect: DOMRect | null = null

// Objetos reutilizados por frame (cero allocations en el bucle)
const raycaster = new Raycaster()
const worldPlane = new Plane()
const planeNormal = new Vector3()
const hitPoint = new Vector3()
const mouseUv = new Vector2(0.5, 0.5)

const CAMERA_DISTANCE = 6
const PLANE_TILT = -0.62

const BRAND_COLORS = {
  deep: '#060203',
  mid: '#c2111b',
  hot: '#ff5a3c',
  sheen: '#ffd9cf',
} as const

/** Lerp independiente del frame rate: misma sensación a 60, 120 o 144 Hz */
function damp(current: number, target: number, ease: number, deltaMs: number): number {
  const factor = 1 - Math.pow(1 - ease, deltaMs / (1000 / 60))
  return current + (target - current) * factor
}

function onPointerMove(event: PointerEvent): void {
  const rect = containerRect
  if (!rect) return
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  pointerSpeed = Math.min(Math.hypot(x - lastPointer.x, y - lastPointer.y) * 14, 1)
  lastPointer.set(x, y)
  pointerTarget.set(x, y)
}

function onVisibilityChange(): void {
  isPageVisible = !document.hidden
  syncTicker()
}

function onContextLost(event: Event): void {
  event.preventDefault()
  isContextLost = true
  syncTicker()
}

function onContextRestored(): void {
  isContextLost = false
  syncTicker()
}

function computePlaneSize(): { width: number; height: number } {
  if (!camera) return { width: 1, height: 1 }
  const vFov = (camera.fov * Math.PI) / 180
  const visibleHeight = 2 * Math.tan(vFov / 2) * CAMERA_DISTANCE
  const visibleWidth = visibleHeight * camera.aspect
  // El plano inclinado necesita más alto que el frustum para no dejar bordes
  return { width: visibleWidth * 1.7, height: visibleHeight * 2.8 }
}

function segmentsFor(width: number): number {
  if (width < 640) return 96
  if (width < 1200) return 150
  return 200
}

function rebuildGeometry(width: number): void {
  if (!mesh) return
  const segments = segmentsFor(width)
  if (segments === currentSegments && geometry) return
  const next = new PlaneGeometry(1, 1, segments, Math.round(segments * 0.9))
  geometry?.dispose()
  geometry = next
  mesh.geometry = next
  currentSegments = segments
}

function resize(): void {
  const container = containerRef.value
  if (!container || !renderer || !camera || !mesh || !uniforms) return

  const width = Math.max(container.clientWidth, 1)
  const height = Math.max(container.clientHeight, 1)
  containerRect = container.getBoundingClientRect()

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, props.maxPixelRatio))
  renderer.setSize(width, height, false)

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  const size = computePlaneSize()
  mesh.scale.set(size.width, size.height, 1)
  mesh.updateMatrixWorld()
  uniforms.uPlaneSize.value.set(size.width, size.height)

  rebuildGeometry(width)

  // Con movimiento reducido no hay bucle: se pinta un único frame estático
  if (reducedMotion) renderFrame(0)
}

/** Proyecta el puntero (NDC) sobre el plano inclinado y devuelve sus UV */
function updateMouseUv(): void {
  if (!camera || !mesh) return
  raycaster.setFromCamera(pointerCurrent, camera)
  planeNormal.set(0, 0, 1).applyQuaternion(mesh.quaternion)
  worldPlane.setFromNormalAndCoplanarPoint(planeNormal, mesh.position)
  if (raycaster.ray.intersectPlane(worldPlane, hitPoint)) {
    mesh.worldToLocal(hitPoint)
    mouseUv.set(hitPoint.x + 0.5, hitPoint.y + 0.5)
  }
}

function renderFrame(deltaMs: number): void {
  if (!renderer || !scene || !camera || !uniforms) return

  if (deltaMs > 0) {
    timer.update()
    uniforms.uTime.value = timer.getElapsed()

    pointerCurrent.x = damp(pointerCurrent.x, pointerTarget.x, props.mouseEase, deltaMs)
    pointerCurrent.y = damp(pointerCurrent.y, pointerTarget.y, props.mouseEase, deltaMs)
    updateMouseUv()

    const uMouse = uniforms.uMouse.value
    uMouse.x = damp(uMouse.x, mouseUv.x, 0.12, deltaMs)
    uMouse.y = damp(uMouse.y, mouseUv.y, 0.12, deltaMs)

    strengthTarget = 0.3 + pointerSpeed * 0.7
    pointerSpeed = damp(pointerSpeed, 0, 0.04, deltaMs)
    uniforms.uMouseStrength.value = damp(uniforms.uMouseStrength.value, strengthTarget, 0.05, deltaMs)

    // Leve paralaje de cámara siguiendo al cursor
    camera.position.x = damp(camera.position.x, pointerCurrent.x * 0.25, 0.04, deltaMs)
    camera.position.y = damp(camera.position.y, pointerCurrent.y * 0.15, 0.04, deltaMs)
    camera.lookAt(0, 0, 0)
  }

  renderer.render(scene, camera)
}

const tick = (_time: number, deltaMs: number): void => {
  // deltaMs puede dispararse tras pausar la pestaña: se acota a 50ms
  renderFrame(Math.min(deltaMs, 50))
}

/** Arranca o detiene el render según visibilidad, pestaña y contexto */
function syncTicker(): void {
  const shouldTick = isVisible && isPageVisible && !isContextLost && !reducedMotion && renderer !== null
  if (shouldTick && !isTicking) {
    // reset() descarta el tiempo transcurrido en pausa: sin saltos al reanudar
    timer.reset()
    gsap.ticker.add(tick)
    isTicking = true
  } else if (!shouldTick && isTicking) {
    gsap.ticker.remove(tick)
    isTicking = false
  }
}

function supportsWebGL(canvas: HTMLCanvasElement): boolean {
  try {
    return canvas.getContext('webgl2') !== null
  } catch {
    return false
  }
}

function init(): void {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  // Se prueba con un canvas descartable para no "consumir" el contexto del real
  if (!supportsWebGL(document.createElement('canvas'))) {
    emit('fallback', 'webgl2-unavailable')
    return
  }

  reducedMotion = prefersReducedMotion()

  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    })
  } catch (error) {
    emit('fallback', error instanceof Error ? error.message : 'renderer-error')
    return
  }

  renderer.outputColorSpace = SRGBColorSpace
  renderer.setClearColor(BRAND_COLORS.deep, 1)

  scene = new Scene()
  camera = new PerspectiveCamera(35, 1, 0.1, 50)
  camera.position.set(0, 0, CAMERA_DISTANCE)

  uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new Vector2(0.5, 0.5) },
    uMouseStrength: { value: 0.3 },
    uProgress: { value: 0 },
    uPlaneSize: { value: new Vector2(1, 1) },
    uAmplitude: { value: props.amplitude },
    uColorDeep: { value: new Color(BRAND_COLORS.deep) },
    uColorMid: { value: new Color(BRAND_COLORS.mid) },
    uColorHot: { value: new Color(BRAND_COLORS.hot) },
    uColorSheen: { value: new Color(BRAND_COLORS.sheen) },
  }

  material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms })
  geometry = new PlaneGeometry(1, 1, 2, 2)
  mesh = new Mesh(geometry, material)
  mesh.rotation.x = PLANE_TILT
  mesh.position.set(0, -0.35, 0)
  mesh.frustumCulled = false
  scene.add(mesh)

  resize()

  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      isVisible = entry ? entry.isIntersecting : true
      if (isVisible) containerRect = container.getBoundingClientRect()
      syncTicker()
    },
    { rootMargin: '64px' },
  )
  intersectionObserver.observe(container)

  // Precompila el programa antes del primer frame visible (evita un hitch)
  renderer.compile(scene, camera)
  renderFrame(0)
  syncTicker()

  isReady.value = true
  emit('ready')
}

/** API pública: el hero comunica el progreso de scroll sin pasar por la reactividad */
function setProgress(value: number): void {
  if (!uniforms) return
  uniforms.uProgress.value = Math.min(Math.max(value, 0), 1)
  if (reducedMotion) renderFrame(0)
}

defineExpose({ setProgress })

onMounted(init)

onUnmounted(() => {
  gsap.ticker.remove(tick)
  isTicking = false
  timer.dispose()

  resizeObserver?.disconnect()
  resizeObserver = null
  intersectionObserver?.disconnect()
  intersectionObserver = null

  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  const canvas = renderer?.domElement
  canvas?.removeEventListener('webglcontextlost', onContextLost)
  canvas?.removeEventListener('webglcontextrestored', onContextRestored)

  if (mesh) scene?.remove(mesh)
  geometry?.dispose()
  material?.dispose()
  scene?.clear()

  if (renderer) {
    renderer.renderLists.dispose()
    renderer.dispose()
    // Libera el contexto WebGL de inmediato (los navegadores limitan ~16 activos)
    renderer.forceContextLoss()
  }

  renderer = null
  scene = null
  camera = null
  geometry = null
  material = null
  mesh = null
  uniforms = null
  containerRect = null
})
</script>

<template>
  <div ref="containerRef" class="absolute inset-0 overflow-hidden" aria-hidden="true">
    <canvas
      ref="canvasRef"
      class="block h-full w-full transition-opacity duration-[1600ms] ease-(--ease-out-expo)"
      :class="isReady ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>

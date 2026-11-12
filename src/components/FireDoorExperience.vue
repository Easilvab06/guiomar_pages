<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'
import FireDoorHUD from '@/components/FireDoorHUD.vue'
import FireDoorChapterContent from '@/components/FireDoorChapterContent.vue'
import { FIRE_DOOR_CHAPTERS, FIRE_DOOR_COMPONENTS, FIRE_DOOR_IMAGES } from '@/data/fireDoorExperience'
import { useFireDoorScroll } from '@/composables/useFireDoorScroll'
import { useSmoothScroll } from '@/utils/smoothScroll'
import { ScrollTrigger, DESKTOP_QUERY, FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from '@/utils/gsap'
import { remap01 } from '@/three/fireDoor/motion'
import type { FireDoorMode, FireDoorProgressState, FireDoorQuality } from '@/types/fireDoor'

interface SceneApi {
  render: (progress: number) => void
}

interface HudApi {
  setProgress: (progress: number) => void
}

const emitFallback = (): void => {
  mode.value = 'static'
}

/** La escena (Three.js) se descarga en un chunk diferido, compartido con el hero */
const FireDoorScene = defineAsyncComponent({
  loader: () => import('@/components/FireDoorScene.vue'),
  onError: (_error, _retry, fail) => {
    emitFallback()
    fail()
  },
})

const chapters = FIRE_DOOR_CHAPTERS
const DETAILS_CHAPTER = chapters.findIndex((c) => c.panel === 'details')
/** Ventana del capítulo 04 en la que se recorren los seis componentes */
const DETAIL_WINDOW = [0.1, 0.9] as const

function supportsWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null
  } catch {
    return false
  }
}

function detectMode(): FireDoorMode {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return 'static'
  return supportsWebGL2() ? 'immersive' : 'static'
}

function detectQuality(): FireDoorQuality {
  const desktop = window.matchMedia(DESKTOP_QUERY).matches && window.matchMedia(FINE_POINTER_QUERY).matches
  const cores = navigator.hardwareConcurrency || 4
  return desktop && cores >= 4 ? 'high' : 'low'
}

const smooth = useSmoothScroll()
const mode = ref<FireDoorMode>(detectMode())
const quality: FireDoorQuality = detectQuality()
const sceneRequested = ref(false)
const detailIndex = ref(0)

const trackRef = ref<HTMLElement | null>(null)
const sceneRef = ref<SceneApi | null>(null)
const hudRef = ref<HudApi | null>(null)

let lazyObserver: IntersectionObserver | null = null
let motionQuery: MediaQueryList | null = null

const immersive = computed(() => mode.value === 'immersive')

function onFrame(state: Readonly<FireDoorProgressState>, changed: boolean): void {
  // La escena decide internamente si debe renderizar (progreso, tamaño o contexto)
  sceneRef.value?.render(state.current)
  if (!changed) return
  hudRef.value?.setProgress(state.current)

  const local = remap01(scroll.chapterLocal(DETAILS_CHAPTER, state.current), DETAIL_WINDOW[0], DETAIL_WINDOW[1])
  const next = Math.min(Math.floor(local * FIRE_DOOR_COMPONENTS.length), FIRE_DOOR_COMPONENTS.length - 1)
  if (next !== detailIndex.value) detailIndex.value = next
}

const scroll = useFireDoorScroll(trackRef, {
  chapters,
  enabled: immersive,
  onFrame,
})

function selectDetail(index: number): void {
  if (!immersive.value) {
    detailIndex.value = index
    return
  }
  // El scroll sigue siendo el controlador: se desplaza al tramo del componente
  const chapter = chapters[DETAILS_CHAPTER]
  if (!chapter) return
  const [from, to] = DETAIL_WINDOW
  const local = from + ((index + 0.5) / FIRE_DOOR_COMPONENTS.length) * (to - from)
  scroll.scrollToProgress(chapter.start + local * (chapter.end - chapter.start))
}

function skip(): void {
  smooth.scrollTo('#puertas-cortafuego-info', { offset: -8 })
}

async function onSceneFallback(): Promise<void> {
  mode.value = 'static'
  await nextTick()
  ScrollTrigger.refresh()
}

function onMotionChange(): void {
  const next = detectMode()
  if (next === mode.value) return
  mode.value = next
  if (next === 'immersive') observeForLazyMount()
}

/** Construye la escena 3D solo cuando la experiencia se aproxima al viewport */
function observeForLazyMount(): void {
  if (sceneRequested.value) return
  void nextTick(() => {
    const track = trackRef.value
    if (!track) return
    lazyObserver?.disconnect()
    lazyObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          sceneRequested.value = true
          lazyObserver?.disconnect()
          lazyObserver = null
        }
      },
      { rootMargin: '150% 0px' },
    )
    lazyObserver.observe(track)
  })
}

onMounted(() => {
  motionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  motionQuery.addEventListener('change', onMotionChange)
  if (immersive.value) observeForLazyMount()
})

onUnmounted(() => {
  motionQuery?.removeEventListener('change', onMotionChange)
  motionQuery = null
  lazyObserver?.disconnect()
  lazyObserver = null
})

const poster = FIRE_DOOR_IMAGES.doorClosed
</script>

<template>
  <!-- Modo inmersivo: escenario fijo (sticky) dentro de un recorrido de ~5 pantallas -->
  <div
    v-if="mode === 'immersive'"
    ref="trackRef"
    class="relative h-[400vh] lg:h-[520vh]"
    role="region"
    aria-roledescription="recorrido interactivo"
    aria-label="The Fire Door Experience: desplázate para abrir la puerta y recorrer el edificio"
  >
    <div class="sticky top-0 h-svh overflow-hidden bg-ink-950">
      <FireDoorScene
        v-if="sceneRequested"
        ref="sceneRef"
        :quality="quality"
        @fallback="onSceneFallback"
      />
      <img
        v-else
        :src="poster.src"
        :srcset="`${poster.srcSmall} 768w, ${poster.src} 1376w`"
        sizes="100vw"
        :width="poster.width"
        :height="poster.height"
        alt=""
        class="absolute inset-0 size-full object-cover"
      />
      <FireDoorHUD
        ref="hudRef"
        :chapters="chapters"
        :active-index="scroll.activeIndex.value"
        :percent="scroll.percent.value"
        :detail-index="detailIndex"
        @select-chapter="scroll.scrollToChapter"
        @select-detail="selectDetail"
        @skip="skip"
      />
    </div>
  </div>

  <!-- Modo estático: sin WebGL o con movimiento reducido. Mismo contenido, sin animación -->
  <div v-else class="bg-ink-950 py-(--spacing-section)" role="region" aria-label="The Fire Door Experience">
    <div class="container-wide">
      <p class="eyebrow flex items-center gap-3 text-paper/60">
        <span class="text-paper">The Fire Door Experience</span>
        <span class="h-px w-8 bg-brand-500" aria-hidden="true" />
        Una puerta. Una barrera. Vidas protegidas.
      </p>
      <div class="mt-16 flex flex-col gap-24 lg:gap-32">
        <article
          v-for="chapter in chapters"
          :id="`fd-capitulo-${chapter.number}`"
          :key="chapter.id"
          :aria-labelledby="`fd-capitulo-${chapter.number}-titulo`"
          class="flex flex-col gap-10"
        >
          <figure
            v-if="chapter.panel === 'none' || chapter.panel === 'conversion'"
            class="overflow-hidden rounded-3xl ring-1 ring-white/10"
          >
            <img
              :src="chapter.image.src"
              :srcset="`${chapter.image.srcSmall} 768w, ${chapter.image.src} 1376w`"
              sizes="(min-width: 1600px) 1500px, 100vw"
              :width="chapter.image.width"
              :height="chapter.image.height"
              :alt="chapter.image.alt"
              loading="lazy"
              decoding="async"
              class="block h-auto w-full"
            />
          </figure>
          <FireDoorChapterContent
            :chapter="chapter"
            :total="chapters.length"
            :detail-index="detailIndex"
            layout="static"
            @select-detail="selectDetail"
          />
        </article>
      </div>
    </div>
  </div>
</template>

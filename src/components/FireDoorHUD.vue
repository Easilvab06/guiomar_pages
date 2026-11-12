<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { ArrowDown, ArrowUpRight, ChevronsDown } from '@lucide/vue'
import FireDoorChapterContent from '@/components/FireDoorChapterContent.vue'
import FireDoorChapters from '@/components/FireDoorChapters.vue'
import { whatsappLink } from '@/data/contact'
import { smoothstep } from '@/three/fireDoor/motion'
import type { FireDoorChapter } from '@/types/fireDoor'

interface Props {
  chapters: readonly FireDoorChapter[]
  activeIndex: number
  percent: number
  detailIndex: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectChapter: [index: number]
  selectDetail: [index: number]
  skip: []
}>()

const barRef = ref<HTMLSpanElement | null>(null)
// Refs indexadas explícitamente: el orden de un array de refs en v-for no está garantizado
const articleRefs: (HTMLElement | undefined)[] = []
function setArticleRef(el: Element | ComponentPublicInstance | null, index: number): void {
  articleRefs[index] = el instanceof HTMLElement ? el : undefined
}

const quoteHref = whatsappLink('Hola S&G, quiero cotizar puertas cortafuego.')
const activeChapter = computed(() => props.chapters[props.activeIndex])
const isLast = computed(() => props.activeIndex === props.chapters.length - 1)
const scrollHint = computed(() =>
  isLast.value ? 'Fin del recorrido' : (activeChapter.value?.microcopy ?? 'Desplázate'),
)

/** Ventana de fundido del texto dentro de cada capítulo (en progreso local) */
const FADE = 0.12

/**
 * Actualización por frame, invocada por el bucle único de la experiencia.
 * Escribe estilos directamente (sin reactividad) para que texto, barra y
 * cámara se muevan en el mismo frame.
 */
function setProgress(progress: number): void {
  if (barRef.value) barRef.value.style.transform = `scaleX(${progress.toFixed(4)})`

  const index = props.activeIndex
  const chapter = props.chapters[index]
  const article = articleRefs[index]
  if (!chapter || !article) return

  const local = Math.min(Math.max((progress - chapter.start) / (chapter.end - chapter.start), 0), 1)
  const fadeIn = index === 0 ? 1 : smoothstep(0, FADE, local)
  const fadeOut = index === props.chapters.length - 1 ? 1 : 1 - smoothstep(1 - FADE, 1, local)
  const alpha = fadeIn * fadeOut
  article.style.opacity = alpha.toFixed(3)
  article.style.transform = `translate3d(0, ${((1 - fadeIn) * 28 - (1 - fadeOut) * 28).toFixed(2)}px, 0)`
}

defineExpose({ setProgress })
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-10 flex flex-col">
    <!-- Velos de legibilidad (no tapan la puerta: solo bordes inferior e izquierdo) -->
    <div
      class="absolute inset-0 bg-[linear-gradient(0deg,rgb(7_7_8/0.92)_0%,rgb(7_7_8/0.55)_26%,transparent_52%),linear-gradient(90deg,rgb(7_7_8/0.55)_0%,transparent_38%)]"
      aria-hidden="true"
    />

    <!-- Indicador de capítulo -->
    <div class="container-wide relative pt-[calc(var(--header-h)+2.25rem)]">
      <p class="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-paper/60">
        <span class="text-paper">The Fire Door Experience</span>
        <span class="h-px w-6 bg-paper/30" aria-hidden="true" />
        <span aria-live="polite">
          Capítulo <span class="text-brand-500">{{ activeChapter?.number }}</span> / {{ String(chapters.length).padStart(2, '0') }}
          · {{ activeChapter?.label }}
        </span>
      </p>
    </div>

    <!-- Navegación por capítulos -->
    <!-- Móvil: fila bajo el indicador; escritorio: columna vertical a la derecha -->
    <div
      class="pointer-events-auto absolute top-[calc(var(--header-h)+4.25rem)] left-[calc(var(--spacing-gutter)-0.5rem)] lg:top-1/2 lg:right-[max(0.5rem,calc(var(--spacing-gutter)-0.75rem))] lg:left-auto lg:-translate-y-1/2"
    >
      <FireDoorChapters :chapters="chapters" :active-index="activeIndex" @select="emit('selectChapter', $event)" />
    </div>

    <!-- Textos de capítulo: todos en el DOM (SEO/lectores), solo el activo visible -->
    <div class="container-wide relative mt-auto grid lg:pr-48">
      <article
        v-for="(chapter, index) in chapters"
        :id="`fd-capitulo-${chapter.number}`"
        :key="chapter.id"
        :ref="(el) => setArticleRef(el, index)"
        :aria-labelledby="`fd-capitulo-${chapter.number}-titulo`"
        :inert="index !== activeIndex"
        class="gpu [grid-area:1/1] self-end"
        :class="index === activeIndex ? 'pointer-events-auto visible' : 'invisible opacity-0'"
      >
        <FireDoorChapterContent
          :chapter="chapter"
          :total="chapters.length"
          :detail-index="detailIndex"
          layout="hud"
          @select-detail="emit('selectDetail', $event)"
        />
      </article>
    </div>

    <!-- Barra inferior: progreso, indicador de scroll, saltar y contacto -->
    <div class="container-wide relative pt-6 pb-5 sm:pb-7">
      <div class="flex items-center gap-4 sm:gap-6">
        <p class="flex items-baseline gap-1 text-paper" aria-label="Progreso de la experiencia">
          <span class="display text-fluid-xl tabular-nums">{{ String(percent).padStart(3, '0') }}</span>
          <span class="text-fluid-xs text-paper/50">%</span>
        </p>
        <span class="relative h-px flex-1 overflow-hidden bg-white/15" aria-hidden="true">
          <span ref="barRef" class="absolute inset-0 origin-left scale-x-0 bg-brand-500" />
        </span>
        <p class="hidden items-center gap-2 text-fluid-xs text-paper/60 md:flex">
          <ArrowDown v-if="!isLast" class="size-4 animate-bounce" aria-hidden="true" />
          {{ scrollHint }}
        </p>
        <div class="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            class="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-fluid-xs font-bold text-paper"
            @click="emit('skip')"
          >
            <ChevronsDown class="size-4" aria-hidden="true" />
            <span class="hidden sm:inline">Saltar experiencia</span>
            <span class="sm:hidden">Saltar</span>
          </button>
          <a
            :href="quoteHref"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-11 items-center gap-2 rounded-full bg-brand-500 px-4 text-fluid-xs font-bold text-white transition-colors duration-300 hover:bg-brand-400"
          >
            Cotizar
            <ArrowUpRight class="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

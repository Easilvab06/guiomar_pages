<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { Maximize2 } from '@lucide/vue'
import { BROCHURES, BROCHURE_GROUP_LABELS } from '@/data/brochures'
import { useGsap } from '@/composables/useGsap'
import { splitReveal } from '@/composables/splitReveal'
import { useBrochureViewer } from '@/composables/useBrochureViewer'
import { gsap, Flip, ScrollTrigger, MOTION_QUERY, prefersReducedMotion } from '@/utils/gsap'
import type { BrochureGroup } from '@/types'

type Filter = BrochureGroup | 'all'

const FILTERS: readonly Filter[] = ['all', 'grupo', 'soinsolar', 'syg']

const sectionRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLUListElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const filter = ref<Filter>('all')
const viewer = useBrochureViewer()

let flipTimeline: gsap.core.Timeline | null = null

const visibleIds = computed<readonly string[]>(() =>
  BROCHURES.filter((b) => filter.value === 'all' || b.group === filter.value).map((b) => b.id),
)

function countFor(value: Filter): number {
  return value === 'all' ? BROCHURES.length : BROCHURES.filter((b) => b.group === value).length
}

function isVisible(id: string): boolean {
  return visibleIds.value.includes(id)
}

function open(id: string): void {
  viewer.open(id, visibleIds.value)
}

/**
 * GSAP Flip: se captura el estado de layout, se aplica el filtro (v-show →
 * display:none) y Flip anima cada tarjeta desde su posición anterior a la
 * nueva. Las que salen/entran se desvanecen con onLeave/onEnter.
 */
async function setFilter(next: Filter): Promise<void> {
  if (next === filter.value) return
  const grid = gridRef.value
  if (!grid || prefersReducedMotion()) {
    filter.value = next
    await nextTick()
    ScrollTrigger.refresh()
    return
  }

  const items = grid.querySelectorAll<HTMLElement>('[data-flip-item]')
  const state = Flip.getState(items)
  flipTimeline?.progress(1).kill()

  filter.value = next
  await nextTick()

  flipTimeline = Flip.from(state, {
    duration: 0.9,
    ease: 'expo.inOut',
    absolute: true,
    scale: true,
    stagger: 0.025,
    onEnter: (elements) =>
      gsap.fromTo(elements, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.7, delay: 0.25 }),
    onLeave: (elements) => gsap.to(elements, { autoAlpha: 0, scale: 0.85, duration: 0.45 }),
    onComplete: () => ScrollTrigger.refresh(),
  })
}

useGsap(sectionRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    if (titleRef.value) splitReveal(titleRef.value, { mode: 'chars' })

    gsap.from(scope.querySelectorAll('[data-gallery-fade]'), {
      autoAlpha: 0,
      y: 24,
      stagger: 0.08,
      scrollTrigger: { trigger: scope, start: 'top 70%', once: true },
    })

    const items = gsap.utils.toArray<HTMLElement>('[data-reveal-item]', scope)
    gsap.set(items, { autoAlpha: 0, y: 70 })
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 1.1, overwrite: true }),
    })
  })
})

onUnmounted(() => {
  flipTimeline?.kill()
  flipTimeline = null
})
</script>

<template>
  <section id="brochures" ref="sectionRef" class="relative bg-ink-900 py-(--spacing-section)" aria-labelledby="brochures-title">
    <div class="container-wide">
      <div class="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <div>
          <p data-gallery-fade class="eyebrow flex items-center gap-3 text-brand-500">
            <span class="h-px w-10 bg-brand-500" aria-hidden="true" />
            Portafolio
          </p>
          <h2 id="brochures-title" class="mt-8">
            <span ref="titleRef" data-split class="display block text-fluid-4xl text-paper">Brochures</span>
          </h2>
          <p data-gallery-fade class="mt-6 max-w-lg text-fluid-base text-paper/65">
            Toda la información de nuestras empresas en un solo lugar. Ábrelos, compártelos o descárgalos.
          </p>
        </div>

        <div data-gallery-fade class="glass flex flex-wrap gap-1 self-start rounded-full p-1.5 lg:self-auto" role="group" aria-label="Filtrar brochures">
          <button
            v-for="value in FILTERS"
            :key="value"
            type="button"
            class="rounded-full px-4 py-2.5 text-fluid-xs font-bold tracking-wide transition-colors duration-300 sm:px-5"
            :class="filter === value ? 'bg-paper text-ink-950' : 'text-paper/70 hover:text-paper'"
            :aria-pressed="filter === value"
            @click="setFilter(value)"
          >
            {{ BROCHURE_GROUP_LABELS[value] }}
            <span class="ml-1 opacity-50">{{ countFor(value) }}</span>
          </button>
        </div>
      </div>

      <ul ref="gridRef" class="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:mt-20 xl:grid-cols-4">
        <li
          v-for="brochure in BROCHURES"
          v-show="isVisible(brochure.id)"
          :key="brochure.id"
          data-flip-item
          :data-flip-id="brochure.id"
          :class="brochure.width > brochure.height ? 'col-span-2' : ''"
        >
          <div data-reveal-item class="h-full">
            <button
              type="button"
              data-cursor-label="Abrir"
              class="group relative block w-full overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/10 sm:rounded-3xl"
              :class="brochure.width > brochure.height ? 'aspect-[3/2] h-full md:aspect-auto' : 'aspect-[2/3]'"
              :aria-label="`Abrir brochure: ${brochure.title}`"
              @click="open(brochure.id)"
            >
              <img
                :src="brochure.thumb"
                :width="brochure.width"
                :height="brochure.height"
                :alt="brochure.title"
                loading="lazy"
                decoding="async"
                class="gpu size-full object-cover transition-transform duration-[1200ms] ease-(--ease-out-expo) group-hover:scale-[1.04]"
              />
              <span
                class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent p-4 pt-16 text-left opacity-100 transition-opacity duration-500 sm:p-5 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100"
              >
                <span class="text-fluid-xs font-semibold text-paper sm:text-fluid-sm">{{ brochure.title }}</span>
                <Maximize2 class="hidden size-4 shrink-0 text-paper sm:block" aria-hidden="true" />
              </span>
            </button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

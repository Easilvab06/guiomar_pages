<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { ArrowDown, ArrowRight, Flame } from '@lucide/vue'
import BaseButton from '@/components/BaseButton.vue'
import { COMPANIES } from '@/data/companies'
import { useGsap } from '@/composables/useGsap'
import { splitReveal } from '@/composables/splitReveal'
import { gsap, MOTION_QUERY } from '@/utils/gsap'

/**
 * Three.js (~130 kB gzip) se descarga en un chunk aparte después del primer
 * render: el texto del hero pinta de inmediato sobre el fondo de respaldo.
 */
const HeroWebGLCanvas = defineAsyncComponent({
  loader: () => import('@/components/HeroWebGLCanvas.vue'),
  onError: (_error, _retry, fail) => {
    webglFailed.value = true
    fail()
  },
})

interface HeroCanvasApi {
  setProgress: (value: number) => void
}

const sectionRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HeroCanvasApi | null>(null)
let lastProgress = 0
const titleRef = ref<HTMLHeadingElement | null>(null)
const accentRef = ref<HTMLSpanElement | null>(null)
const webglFailed = ref(false)

useGsap(sectionRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    const title = titleRef.value
    const accent = accentRef.value
    if (!title || !accent) return

    splitReveal(title, { mode: 'chars', trigger: false, delay: 0.35, stagger: 0.018 })
    splitReveal(accent, { mode: 'words', trigger: false, delay: 0.95, stagger: 0.08 })

    gsap.from(scope.querySelectorAll('[data-hero-fade]'), {
      autoAlpha: 0,
      y: 28,
      duration: 1.3,
      delay: 1.15,
      stagger: 0.09,
    })

    // Salida del hero: el contenido sube y se desvanece, la seda se aplana
    gsap
      .timeline({
        scrollTrigger: {
          trigger: scope,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            lastProgress = self.progress
            canvasRef.value?.setProgress(lastProgress)
          },
        },
      })
      .to(scope.querySelector('[data-hero-content]'), { yPercent: -18, autoAlpha: 0, ease: 'none' }, 0)
      .to(scope.querySelector('[data-hero-canvas]'), { yPercent: 22, ease: 'none' }, 0)
  })
})
</script>

<template>
  <section
    id="inicio"
    ref="sectionRef"
    class="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink-950"
    aria-labelledby="hero-title"
  >
    <div data-hero-canvas class="gpu absolute inset-0 -z-10">
      <!-- Respaldo: visible mientras carga Three.js o si WebGL no está disponible -->
      <div
        class="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_110%,#c2111b_0%,#3a0508_38%,#070708_70%)]"
      />
      <HeroWebGLCanvas
        v-if="!webglFailed"
        ref="canvasRef"
        @ready="canvasRef?.setProgress(lastProgress)"
        @fallback="webglFailed = true"
      />
    </div>
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_7_8/0.6)_0%,transparent_28%,transparent_50%,rgb(7_7_8/0.96)_100%),linear-gradient(90deg,rgb(7_7_8/0.7)_0%,rgb(7_7_8/0.25)_45%,transparent_70%)]"
      aria-hidden="true"
    />

    <div
      data-hero-content
      class="container-wide flex flex-1 flex-col justify-end pt-[calc(var(--header-h)+4rem)] pb-8 sm:pb-10"
    >
      <p data-hero-fade class="eyebrow mb-8 flex items-center gap-3 text-paper/70">
        <span class="h-px w-10 bg-brand-500" aria-hidden="true" />
        Grupo Empresarial · Colombia
      </p>

      <h1 id="hero-title" class="max-w-[min(100%,78rem)]">
        <span ref="titleRef" data-split class="display block text-fluid-hero text-paper">
          Un solo aliado estratégico,
        </span>
        <span
          ref="accentRef"
          data-split
          class="mt-1 block font-serif text-fluid-3xl leading-[0.95] tracking-tight text-brand-400 italic"
        >
          múltiples soluciones.
        </span>
      </h1>

      <div class="mt-10 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div data-hero-fade class="max-w-xl">
          <p class="text-fluid-lg leading-relaxed text-paper/80">
            {{ COMPANIES.length }} empresas, un mismo propósito: brindar soluciones integrales que impulsan el
            desarrollo y la sostenibilidad de tus proyectos.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <BaseButton href="#empresas" size="lg">
              Conoce las empresas
              <ArrowRight class="size-5" aria-hidden="true" />
            </BaseButton>
            <BaseButton href="#puertas-cortafuego" variant="glass" size="lg">
              <Flame class="size-5 text-brand-400" aria-hidden="true" />
              Puertas cortafuego
            </BaseButton>
          </div>
        </div>

        <aside data-hero-fade class="glass hidden max-w-sm rounded-3xl p-6 lg:block" aria-label="Especialidad destacada">
          <p class="eyebrow flex items-center gap-2 text-paper/70">
            <span class="size-1.5 rounded-full bg-brand-400" aria-hidden="true" />
            Especialidad destacada
          </p>
          <p class="mt-3 text-fluid-lg leading-snug font-semibold text-paper">
            Suministro, instalación y mantenimiento de puertas cortafuego certificadas.
          </p>
          <p class="mt-5 flex flex-col gap-1 border-t border-white/15 pt-4 text-paper/60">
            <span class="display text-fluid-2xl whitespace-nowrap text-paper">60 · 90 · 120</span>
            <span class="text-fluid-xs">minutos · opciones de resistencia al fuego</span>
          </p>
        </aside>
      </div>

      <div data-hero-fade class="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-fluid-xs text-paper/50">
        <span class="flex items-center gap-2">
          <ArrowDown class="size-4 animate-bounce" aria-hidden="true" />
          Desplázate para explorar
        </span>
        <span class="hidden sm:inline">Energía · Construcción · Seguridad</span>
      </div>
    </div>
  </section>
</template>

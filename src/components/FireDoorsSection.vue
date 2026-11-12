<script setup lang="ts">
import { ref } from 'vue'
import { CircleCheck, Flame, ShieldCheck } from '@lucide/vue'
import FireDoorExperience from '@/components/FireDoorExperience.vue'
import { FIRE_DOOR_STEPS, REGULATIONS } from '@/data/companies'
import { BROCHURES, requireBrochure } from '@/data/brochures'
import { useGsap } from '@/composables/useGsap'
import { splitReveal } from '@/composables/splitReveal'
import { useBrochureViewer } from '@/composables/useBrochureViewer'
import { gsap, ScrollTrigger, DESKTOP_QUERY, MOTION_QUERY } from '@/utils/gsap'

/**
 * Sección S&G · Puertas cortafuego.
 *
 * 1. The Fire Door Experience (capítulos 01–07): apertura de la puerta,
 *    laberinto, ingeniería, resistencia (60/90/120), aplicaciones y la
 *    conversión con los enlaces reales de WhatsApp.
 * 2. Información de servicio (#puertas-cortafuego-info): proceso de
 *    suministro → instalación → mantenimiento → cumplimiento con sus
 *    brochures, y la normativa. Es el destino del botón "Saltar experiencia".
 *
 * Resistencia, aplicaciones y llamado a la acción viven solo en los
 * capítulos de la experiencia (también visibles en su modo estático), para
 * no duplicar contenido.
 */

const infoRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const accentRef = ref<HTMLElement | null>(null)
const activeStep = ref(0)

const viewer = useBrochureViewer()
const SYG_PLAYLIST = BROCHURES.filter((b) => b.group === 'syg').map((b) => b.id)
const steps = FIRE_DOOR_STEPS.map((step) => ({ ...step, brochure: requireBrochure(step.brochureId) }))

function openStepBrochure(brochureId: string): void {
  viewer.open(brochureId, SYG_PLAYLIST)
}

useGsap(infoRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    if (titleRef.value) splitReveal(titleRef.value, { mode: 'chars' })
    if (accentRef.value) splitReveal(accentRef.value, { mode: 'words', delay: 0.25 })

    gsap.from(scope.querySelectorAll('[data-fd-fade]'), {
      autoAlpha: 0,
      y: 32,
      stagger: 0.08,
      scrollTrigger: { trigger: scope, start: 'top 70%', once: true },
    })

    ScrollTrigger.batch(scope.querySelectorAll('[data-fd-card]'), {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.from(batch, { autoAlpha: 0, y: 50, stagger: 0.07, duration: 1 }),
    })
  })

  // Escritorio: columna de imágenes fija (sticky) sincronizada con cada paso
  mm.add(DESKTOP_QUERY, () => {
    gsap.utils.toArray<HTMLElement>('[data-step]', scope).forEach((step, index) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) activeStep.value = index
        },
      })
    })
    return () => {
      activeStep.value = 0
    }
  })
})
</script>

<template>
  <section id="puertas-cortafuego" class="relative bg-ink-950" aria-labelledby="fd-title">
    <h2 id="fd-title" class="sr-only">Puertas cortafuego — S&amp;G Soluciones Integrales</h2>

    <FireDoorExperience />

    <div
      id="puertas-cortafuego-info"
      ref="infoRef"
      class="grain relative bg-paper py-(--spacing-section) text-ink-950"
      aria-labelledby="fd-info-title"
    >
      <div class="container-wide">
        <!-- Encabezado -->
        <div class="grid gap-12 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <p data-fd-fade class="eyebrow flex items-center gap-3 text-brand-600">
              <Flame class="size-4" aria-hidden="true" />
              S&amp;G Soluciones Integrales · Especialidad destacada
            </p>
            <h3 id="fd-info-title" class="mt-8">
              <span ref="titleRef" data-split class="display block text-fluid-5xl">Puertas cortafuego</span>
              <span ref="accentRef" data-split class="block font-serif text-fluid-3xl leading-none text-brand-600 italic">
                protección que salva vidas.
              </span>
            </h3>
          </div>
          <div class="lg:col-span-5 lg:self-end">
            <p data-fd-fade class="text-fluid-base leading-relaxed text-ink-950/75">
              Una puerta cortafuego contiene el fuego y el humo durante un tiempo determinado, protege las rutas de
              evacuación y le da a las personas el tiempo que necesitan para salir. En S&amp;G nos encargamos de todo
              el ciclo: suministro, instalación, mantenimiento y cumplimiento normativo.
            </p>
          </div>
        </div>

        <!-- Proceso con columna de imagen fija -->
        <div class="mt-24 grid gap-16 lg:mt-32 lg:grid-cols-12 lg:gap-10">
          <div class="hidden lg:col-span-5 lg:block">
            <div class="sticky top-[calc(var(--header-h)+3rem)]">
              <button
                type="button"
                data-cursor-label="Ver"
                class="relative block aspect-[2/3] w-full max-w-md overflow-hidden rounded-[2rem] bg-ink-950 shadow-[0_40px_80px_-30px_rgb(13_13_15/0.55)]"
                :aria-label="`Abrir brochure: ${steps[activeStep]?.brochure.title ?? ''}`"
                @click="openStepBrochure(steps[activeStep]?.brochureId ?? 'sg-puertas-cortafuego')"
              >
                <img
                  v-for="(step, index) in steps"
                  :key="step.id"
                  :src="step.brochure.src"
                  :width="step.brochure.width"
                  :height="step.brochure.height"
                  :alt="step.brochure.title"
                  loading="lazy"
                  decoding="async"
                  class="gpu absolute inset-0 size-full object-cover transition-[clip-path,scale] duration-[1100ms] ease-(--ease-in-out-quint)"
                  :class="
                    index === activeStep
                      ? 'z-10 scale-100 [clip-path:inset(0%_0%_0%_0%)]'
                      : index < activeStep
                        ? 'z-0 scale-105 [clip-path:inset(0%_0%_0%_0%)]'
                        : 'z-20 scale-110 [clip-path:inset(100%_0%_0%_0%)]'
                  "
                />
              </button>
              <div class="mt-6 flex max-w-md items-center justify-between">
                <span class="eyebrow text-ink-950/55">
                  <span class="text-brand-600">{{ String(activeStep + 1).padStart(2, '0') }}</span>
                  / {{ String(steps.length).padStart(2, '0') }}
                </span>
                <span class="flex gap-1.5" aria-hidden="true">
                  <span
                    v-for="(step, index) in steps"
                    :key="step.id"
                    class="h-1 rounded-full transition-[width,background-color] duration-500"
                    :class="index === activeStep ? 'w-8 bg-brand-600' : 'w-3 bg-ink-950/20'"
                  />
                </span>
              </div>
            </div>
          </div>

          <ol class="flex flex-col gap-16 lg:col-span-6 lg:col-start-7 lg:gap-0">
            <li
              v-for="(step, index) in steps"
              :key="step.id"
              data-step
              class="flex flex-col justify-center lg:min-h-[78vh]"
            >
              <button
                type="button"
                class="mb-8 block overflow-hidden rounded-3xl lg:hidden"
                :aria-label="`Abrir brochure: ${step.brochure.title}`"
                @click="openStepBrochure(step.brochureId)"
              >
                <img
                  :src="step.brochure.thumb"
                  :width="step.brochure.width"
                  :height="step.brochure.height"
                  :alt="step.brochure.title"
                  loading="lazy"
                  decoding="async"
                  class="h-auto w-full"
                />
              </button>
              <div
                class="transition-opacity duration-700"
                :class="index === activeStep ? 'lg:opacity-100' : 'lg:opacity-35'"
              >
                <div class="flex items-center gap-4">
                  <span class="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
                    <component :is="step.icon" class="size-6" :stroke-width="1.75" aria-hidden="true" />
                  </span>
                  <span class="eyebrow text-ink-950/50">Paso {{ step.index }}</span>
                </div>
                <h4 class="mt-8">
                  <span class="display block text-fluid-3xl">{{ step.title }}</span>
                  <span class="display block text-fluid-3xl text-brand-600">{{ step.highlight }}</span>
                </h4>
                <p class="mt-6 max-w-lg text-fluid-base leading-relaxed text-ink-950/70">{{ step.description }}</p>
                <ul class="mt-8 grid gap-3">
                  <li v-for="point in step.points" :key="point" class="flex items-start gap-3 text-fluid-base font-semibold">
                    <CircleCheck class="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                    {{ point }}
                  </li>
                </ul>
              </div>
            </li>
          </ol>
        </div>

        <!-- Normativa -->
        <div class="mt-24 lg:mt-32">
          <div class="flex flex-col justify-between gap-6 border-b border-ink-950/15 pb-8 sm:flex-row sm:items-end">
            <h3 class="display text-fluid-2xl">Alineados con la normativa</h3>
            <p class="max-w-md text-fluid-sm text-ink-950/65">
              Nuestras puertas cortafuego se suministran e instalan conforme a normas nacionales e internacionales,
              con verificación y certificación de cada instalación.
            </p>
          </div>
          <ul class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <li
              v-for="regulation in REGULATIONS"
              :key="regulation.code"
              data-fd-card
              class="group flex flex-col justify-between gap-10 rounded-3xl border border-ink-950/10 bg-white p-6 transition-[background-color,color,border-color] duration-500 hover:border-ink-950 hover:bg-ink-950 hover:text-paper"
            >
              <ShieldCheck class="size-6 text-brand-600" aria-hidden="true" />
              <div>
                <p class="display text-fluid-xl">{{ regulation.code }}</p>
                <p class="mt-1 text-fluid-sm font-semibold">{{ regulation.name }}</p>
                <p class="mt-3 text-fluid-xs leading-relaxed opacity-65">{{ regulation.scope }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

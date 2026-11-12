<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowUpRight, Check, Eye, Plus } from '@lucide/vue'
import { COMPANIES } from '@/data/companies'
import { BROCHURES, findBrochure } from '@/data/brochures'
import { whatsappLink } from '@/data/contact'
import { useGsap } from '@/composables/useGsap'
import { splitReveal } from '@/composables/splitReveal'
import { useBrochureViewer } from '@/composables/useBrochureViewer'
import { gsap, ScrollTrigger, DESKTOP_QUERY, MOTION_QUERY, prefersReducedMotion } from '@/utils/gsap'
import type { Company } from '@/types'

const sectionRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const accentRef = ref<HTMLElement | null>(null)

const activeId = ref<string | null>(null)
const isDesktop = ref(false)
const viewer = useBrochureViewer()

let desktopQuery: MediaQueryList | null = null
let detailTween: gsap.core.Tween | null = null

/** Filas asimétricas en escritorio: 4 + 4, la segunda desplazada */
const rows = computed<readonly (readonly Company[])[]>(() => [COMPANIES.slice(0, 4), COMPANIES.slice(4)])

const SYG_PLAYLIST = BROCHURES.filter((b) => b.group === 'syg').map((b) => b.id)

function columnsFor(row: readonly Company[]): string {
  const active = activeId.value
  const activeInRow = active !== null && row.some((c) => c.id === active)
  return row
    .map((company) => {
      if (activeInRow) return company.id === active ? '2.7fr' : '1fr'
      return company.featured ? '1.45fr' : '1fr'
    })
    .join(' ')
}

/** Panel estrecho porque otro de su misma fila está expandido */
function isCompressed(company: Company, row: readonly Company[]): boolean {
  const active = activeId.value
  return active !== null && active !== company.id && row.some((c) => c.id === active)
}

function setActive(id: string | null): void {
  activeId.value = id
}

function onPanelEnter(event: PointerEvent, id: string): void {
  if (isDesktop.value && event.pointerType === 'mouse') setActive(id)
}

function onRowLeave(event: PointerEvent): void {
  if (isDesktop.value && event.pointerType === 'mouse') setActive(null)
}

function onToggle(id: string): void {
  if (isDesktop.value) setActive(id)
  else setActive(activeId.value === id ? null : id)
}

function openBrochure(company: Company): void {
  if (!company.brochureId) return
  viewer.open(company.brochureId, company.id === 'syg' ? SYG_PLAYLIST : undefined)
}

function quoteLink(company: Company): string {
  return whatsappLink(`Hola, me interesa ${company.name} (${company.category}). ¿Me pueden enviar información?`)
}

function onDesktopChange(): void {
  isDesktop.value = desktopQuery?.matches ?? false
}

// Revela el contenido del panel activo con un stagger
watch(activeId, async (id) => {
  detailTween?.kill()
  detailTween = null
  if (!id || prefersReducedMotion()) return
  await nextTick()
  const items = sectionRef.value?.querySelectorAll(`[data-panel="${id}"] [data-detail-item]`)
  if (!items || items.length === 0) return
  detailTween = gsap.fromTo(
    items,
    { y: 26, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.85, stagger: 0.045, delay: 0.12, ease: 'expo.out', clearProps: 'transform' },
  )
  // En móvil el acordeón cambia la altura del documento
  if (!isDesktop.value) gsap.delayedCall(0.7, () => ScrollTrigger.refresh())
})

useGsap(sectionRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    if (titleRef.value) splitReveal(titleRef.value, { mode: 'chars' })
    if (accentRef.value) splitReveal(accentRef.value, { mode: 'words', delay: 0.2 })

    gsap.from(scope.querySelectorAll('[data-intro-fade]'), {
      autoAlpha: 0,
      y: 30,
      stagger: 0.1,
      scrollTrigger: { trigger: scope, start: 'top 70%', once: true },
    })

    const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', scope)
    gsap.set(panels, { autoAlpha: 0, y: 90 })
    ScrollTrigger.batch(panels, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, overwrite: true }),
    })
  })

  // Paralaje sutil del icono de fondo de cada panel (solo escritorio)
  mm.add(`${DESKTOP_QUERY} and ${MOTION_QUERY}`, () => {
    gsap.utils.toArray<HTMLElement>('[data-panel-glyph]', scope).forEach((glyph) => {
      gsap.fromTo(
        glyph,
        { yPercent: 18 },
        {
          yPercent: -18,
          ease: 'none',
          scrollTrigger: { trigger: glyph.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  })
})

onMounted(() => {
  desktopQuery = window.matchMedia(DESKTOP_QUERY)
  desktopQuery.addEventListener('change', onDesktopChange)
  onDesktopChange()
})

onUnmounted(() => {
  desktopQuery?.removeEventListener('change', onDesktopChange)
  desktopQuery = null
  detailTween?.kill()
  detailTween = null
})
</script>

<template>
  <section
    id="empresas"
    ref="sectionRef"
    class="relative bg-ink-950 py-(--spacing-section)"
    aria-labelledby="empresas-title"
  >
    <div class="container-wide">
      <!-- Encabezado asimétrico -->
      <div class="grid gap-10 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <p data-intro-fade class="eyebrow flex items-center gap-3 text-brand-500">
            <span class="h-px w-10 bg-brand-500" aria-hidden="true" />
            Nuestras soluciones · {{ String(COMPANIES.length).padStart(2, '0') }} empresas
          </p>
          <h2 id="empresas-title" class="mt-8">
            <span ref="titleRef" data-split class="display block text-fluid-4xl text-paper">Ocho empresas,</span>
            <span
              ref="accentRef"
              data-split
              class="block font-serif text-fluid-3xl leading-none tracking-tight text-paper/60 italic lg:pl-[12%]"
            >
              un mismo propósito.
            </span>
          </h2>
        </div>
        <div class="lg:col-span-4 lg:self-end">
          <p data-intro-fade class="text-fluid-base leading-relaxed text-paper/70">
            Energía, infraestructura, acabados, espacios verdes y seguridad contra incendios: un portafolio completo
            para proyectos empresariales, comerciales, institucionales y residenciales, con un solo interlocutor.
          </p>
          <p data-intro-fade class="mt-6 text-fluid-sm text-paper/45">
            <span class="hidden lg:inline">Pasa el cursor sobre cada empresa para conocerla.</span>
            <span class="lg:hidden">Toca cada empresa para conocerla.</span>
          </p>
        </div>
      </div>

      <!-- Paneles -->
      <div class="mt-16 flex flex-col gap-3 lg:mt-24 lg:gap-4">
        <div
          v-for="(row, rowIndex) in rows"
          :key="rowIndex"
          class="flex flex-col gap-3 lg:grid lg:gap-4 lg:transition-[grid-template-columns] lg:duration-700 lg:ease-(--ease-out-expo)"
          :class="rowIndex === 1 ? 'lg:ml-[7%]' : 'lg:mr-[7%]'"
          :style="isDesktop ? { gridTemplateColumns: columnsFor(row) } : undefined"
          @pointerleave="onRowLeave"
        >
          <article
            v-for="company in row"
            :key="company.id"
            :data-panel="company.id"
            :data-active="activeId === company.id"
            class="group/panel relative isolate overflow-hidden rounded-3xl border transition-[border-color,background-color] duration-500 lg:h-[46rem] xl:h-[42rem]"
            :class="[
              company.featured
                ? 'border-brand-500/60 bg-brand-700'
                : activeId === company.id
                  ? 'border-white/20 bg-ink-800'
                  : 'border-white/10 bg-ink-900',
            ]"
            :style="{ '--accent': company.accent }"
            @pointerenter="onPanelEnter($event, company.id)"
          >
            <!-- Fondo: gradiente de acento + glifo gigante -->
            <div
              class="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity duration-700 group-data-[active=true]/panel:opacity-100"
              :class="
                company.featured
                  ? 'bg-[radial-gradient(90%_70%_at_100%_0%,#ff3b45_0%,transparent_60%),linear-gradient(180deg,#c2111b,#6d0910)]'
                  : 'bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_oklab,var(--accent)_32%,transparent)_0%,transparent_70%)]'
              "
              aria-hidden="true"
            />
            <component
              :is="company.icon"
              data-panel-glyph
              class="pointer-events-none absolute -right-10 -bottom-10 -z-10 hidden size-72 opacity-[0.07] lg:block"
              :class="company.featured ? 'text-white opacity-15' : 'text-(--accent)'"
              :stroke-width="0.75"
              aria-hidden="true"
            />

            <div class="flex h-full flex-col p-6 sm:p-7 lg:p-8">
              <!-- Cabecera (botón de divulgación accesible) -->
              <button
                type="button"
                class="flex w-full items-center gap-4 text-left lg:flex-1 lg:flex-col lg:items-start lg:justify-between"
                :aria-expanded="activeId === company.id"
                :aria-controls="`panel-detail-${company.id}`"
                @click="onToggle(company.id)"
                @focus="isDesktop && setActive(company.id)"
              >
                <span class="flex shrink-0 items-center justify-between gap-4 lg:w-full">
                  <span class="eyebrow hidden lg:inline" :class="company.featured ? 'text-white/80' : 'text-paper/40'">
                    {{ String(COMPANIES.indexOf(company) + 1).padStart(2, '0') }}
                    <span v-if="company.featured" class="ml-2 rounded-full bg-white px-2 py-1 text-[0.6rem] text-brand-600">
                      Destacado
                    </span>
                  </span>
                  <span
                    class="flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-data-[active=true]/panel:rotate-[-8deg]"
                    :class="company.featured ? 'bg-white text-brand-600' : 'bg-white/5 text-(--accent) ring-1 ring-white/10'"
                  >
                    <component :is="company.icon" class="size-6" :stroke-width="1.75" aria-hidden="true" />
                  </span>
                </span>

                <span class="flex min-w-0 flex-1 flex-col gap-1 lg:mt-auto lg:w-full lg:flex-none lg:gap-2">
                  <span class="eyebrow" :class="company.featured ? 'text-white/75' : 'text-(--accent)'">
                    {{ company.category }}
                    <span v-if="company.featured" class="lg:hidden"> · Destacado</span>
                  </span>
                  <span
                    class="display text-fluid-xl text-balance text-paper transition-[font-size] duration-500"
                    :class="isDesktop && isCompressed(company, row) ? 'lg:text-fluid-lg' : 'lg:text-fluid-2xl'"
                  >
                    {{ company.name }}
                  </span>
                </span>

                <Plus
                  class="size-6 shrink-0 text-paper/60 transition-transform duration-500 lg:hidden"
                  :class="activeId === company.id ? 'rotate-45' : ''"
                  aria-hidden="true"
                />
              </button>

              <!-- Detalle: acordeón en móvil, revelado lateral en escritorio -->
              <div
                :id="`panel-detail-${company.id}`"
                class="grid transition-[grid-template-rows] duration-700 ease-(--ease-out-expo) lg:block"
                :class="activeId === company.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              >
                <div
                  class="min-h-0 overflow-hidden transition-opacity duration-500 lg:overflow-visible"
                  :class="
                    activeId === company.id
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0 lg:invisible lg:absolute lg:inset-x-8 lg:bottom-8'
                  "
                >
                  <div class="pt-6 lg:flex lg:w-full lg:min-w-[22rem] lg:gap-8 lg:pt-6">
                    <div class="min-w-0 flex-1">
                      <p data-detail-item class="font-serif text-fluid-xl leading-tight text-paper italic">
                        {{ company.tagline }}
                      </p>
                      <p
                        data-detail-item
                        class="mt-3 text-fluid-sm leading-relaxed"
                        :class="company.featured ? 'text-white/85' : 'text-paper/65'"
                      >
                        {{ company.description }}
                      </p>
                      <ul class="mt-5 grid gap-2">
                        <li
                          v-for="service in company.services"
                          :key="service"
                          data-detail-item
                          class="flex items-start gap-2 text-fluid-sm text-paper/85"
                        >
                          <Check
                            class="mt-0.5 size-4 shrink-0"
                            :class="company.featured ? 'text-white' : 'text-(--accent)'"
                            :stroke-width="2.5"
                            aria-hidden="true"
                          />
                          {{ service }}
                        </li>
                      </ul>

                      <dl v-if="company.stats" data-detail-item class="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                        <div v-for="stat in company.stats" :key="stat.value + stat.label" class="flex items-baseline gap-2">
                          <dt class="display text-fluid-xl text-paper">{{ stat.value }}</dt>
                          <dd class="text-fluid-xs text-paper/60">{{ stat.label }}</dd>
                        </div>
                      </dl>

                      <div data-detail-item class="mt-7 flex flex-wrap items-center gap-3">
                        <a
                          :href="quoteLink(company)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex h-11 items-center gap-2 rounded-full px-5 text-fluid-sm font-semibold transition-colors duration-300"
                          :class="
                            company.featured
                              ? 'bg-white text-brand-600 hover:bg-paper'
                              : 'bg-paper text-ink-950 hover:bg-white'
                          "
                        >
                          Cotizar
                          <ArrowUpRight class="size-4" aria-hidden="true" />
                        </a>
                        <button
                          v-if="company.brochureId"
                          type="button"
                          class="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-fluid-sm font-semibold text-paper transition-colors duration-300 hover:bg-white/10"
                          @click="openBrochure(company)"
                        >
                          <Eye class="size-4" aria-hidden="true" />
                          Ver brochure
                        </button>
                        <a
                          v-if="company.website"
                          :href="company.website"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-fluid-sm font-semibold text-paper/70 underline decoration-white/25 underline-offset-4 hover:text-paper"
                        >
                          Sitio web
                        </a>
                      </div>
                    </div>

                    <button
                      v-if="company.brochureId && findBrochure(company.brochureId)"
                      type="button"
                      data-detail-item
                      data-cursor-label="Ver"
                      class="hidden w-44 shrink-0 self-end overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 transition-transform duration-700 hover:-rotate-2 2xl:block"
                      :aria-label="`Abrir brochure de ${company.name}`"
                      @click="openBrochure(company)"
                    >
                      <img
                        :src="findBrochure(company.brochureId)?.thumb"
                        :width="findBrochure(company.brochureId)?.width"
                        :height="findBrochure(company.brochureId)?.height"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        class="h-auto w-full"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

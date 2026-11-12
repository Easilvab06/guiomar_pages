<script setup lang="ts">
import { ref } from 'vue'
import { Compass, Target } from '@lucide/vue'
import { COMPANY_VALUES } from '@/data/companies'
import { useGsap } from '@/composables/useGsap'
import { gsap, ScrollTrigger, SplitText, MOTION_QUERY } from '@/utils/gsap'

const sectionRef = ref<HTMLElement | null>(null)
const statementRef = ref<HTMLParagraphElement | null>(null)

const PILLARS = [
  {
    title: 'Misión',
    icon: Target,
    text: 'Brindar soluciones integrales con productos y servicios de alta calidad, contribuyendo al desarrollo y crecimiento de nuestros clientes, a través de la excelencia, la innovación y el compromiso.',
  },
  {
    title: 'Visión',
    icon: Compass,
    text: 'Ser reconocidos como un grupo empresarial líder en el mercado, por nuestra capacidad de generar valor, confianza y bienestar en cada uno de nuestros clientes, aliados y comunidades.',
  },
] as const

useGsap(sectionRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    const statement = statementRef.value
    if (statement) {
      // Lectura guiada: cada palabra se "enciende" al ritmo del scroll
      SplitText.create(statement, {
        type: 'words',
        autoSplit: true,
        aria: 'auto',
        onSplit(self: SplitText) {
          statement.classList.add('is-split')
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: 'none',
              scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
            },
          )
        },
      })
    }

    ScrollTrigger.batch(scope.querySelectorAll('[data-about-card]'), {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.from(batch, { autoAlpha: 0, y: 60, stagger: 0.1, duration: 1.1 }),
    })
  })
})
</script>

<template>
  <section id="nosotros" ref="sectionRef" class="relative bg-ink-950 py-(--spacing-section)" aria-labelledby="nosotros-title">
    <div class="container-wide">
      <div class="grid gap-10 lg:grid-cols-12">
        <h2 id="nosotros-title" class="eyebrow flex items-center gap-3 self-start text-brand-500 lg:col-span-3 lg:pt-4">
          <span class="h-px w-10 bg-brand-500" aria-hidden="true" />
          Quiénes somos
        </h2>
        <p
          ref="statementRef"
          data-split
          class="text-fluid-2xl leading-[1.18] font-semibold tracking-tight text-balance text-paper lg:col-span-9"
        >
          Somos una organización comprometida con el desarrollo de soluciones integrales para el sector empresarial,
          comercial, institucional y residencial. Representamos marcas líderes y confiables, y acompañamos a cada
          cliente de forma cercana y personalizada, como un aliado estratégico que aporta valor a su negocio.
        </p>
      </div>

      <div class="mt-20 grid gap-4 md:grid-cols-2 lg:mt-28 lg:ml-[25%]">
        <article v-for="pillar in PILLARS" :key="pillar.title" data-about-card class="glass rounded-3xl p-8 lg:p-10">
          <component :is="pillar.icon" class="size-7 text-brand-500" :stroke-width="1.75" aria-hidden="true" />
          <h3 class="display mt-10 text-fluid-2xl text-paper">Nuestra {{ pillar.title.toLowerCase() }}</h3>
          <p class="mt-4 text-fluid-base leading-relaxed text-paper/70">{{ pillar.text }}</p>
        </article>
      </div>

      <div class="mt-24 lg:mt-32">
        <h3 class="display text-fluid-2xl text-paper">Nuestros valores</h3>
        <ul class="mt-10 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-5">
          <li
            v-for="(value, index) in COMPANY_VALUES"
            :key="value.title"
            data-about-card
            class="group flex flex-col gap-6 border-b border-white/10 py-8 sm:pr-6 lg:border-b-0 lg:py-10"
            :class="index > 0 ? 'lg:border-l lg:pl-6' : ''"
          >
            <span
              class="flex size-14 items-center justify-center rounded-full bg-brand-600 text-white transition-transform duration-500 group-hover:-rotate-12"
            >
              <component :is="value.icon" class="size-6" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <div>
              <p class="text-fluid-lg font-bold text-paper">{{ value.title }}</p>
              <p class="mt-2 text-fluid-sm leading-relaxed text-paper/60">{{ value.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

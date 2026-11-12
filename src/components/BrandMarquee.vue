<script setup lang="ts">
import { ref } from 'vue'
import { COMPANIES } from '@/data/companies'
import { useGsap } from '@/composables/useGsap'
import { gsap, Observer, MOTION_QUERY } from '@/utils/gsap'

const rootRef = ref<HTMLElement | null>(null)

// Dos copias por fila: al desplazar -50% el bucle es perfecto
const COPIES = [0, 1] as const

useGsap(rootRef, (mm, scope) => {
  mm.add(MOTION_QUERY, () => {
    const tracks = gsap.utils.toArray<HTMLElement>('[data-marquee-track]', scope)

    const loops = tracks.map((track, index) => {
      const direction = index % 2 === 0 ? -1 : 1
      gsap.set(track, { xPercent: direction === -1 ? 0 : -50 })
      const loop = gsap.to(track, {
        xPercent: direction === -1 ? -50 : 0,
        duration: 38 + index * 6,
        ease: 'none',
        repeat: -1,
      })
      // Un tween infinito en totalTime 0 se detendría al invertir su timeScale:
      // se adelanta un número entero de ciclos para poder correr en ambos sentidos.
      loop.totalTime(loop.duration() * 1000)
      return loop
    })

    // Observer: la velocidad y el sentido del scroll aceleran o invierten el
    // marquee; luego vuelve con inercia a su velocidad base.
    let baseDirection = 1
    Observer.create({
      target: window,
      type: 'wheel,touch,scroll',
      tolerance: 6,
      onChangeY(self) {
        const velocity = Math.abs(self.velocityY)
        baseDirection = self.deltaY >= 0 ? 1 : -1
        const boost = gsap.utils.clamp(1, 6, 1 + velocity / 900)
        for (const loop of loops) {
          gsap.to(loop, { timeScale: baseDirection * boost, duration: 0.25, overwrite: true })
          gsap.to(loop, { timeScale: baseDirection, duration: 1.4, delay: 0.25, ease: 'power3.out' })
        }
      },
    })

    // Inclinación sutil ligada al scroll (paralaje entre filas)
    gsap.fromTo(
      tracks,
      { x: (i: number) => (i % 2 === 0 ? 60 : -60) },
      {
        x: (i: number) => (i % 2 === 0 ? -60 : 60),
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  })
})
</script>

<template>
  <section ref="rootRef" class="relative overflow-hidden border-y border-white/10 bg-ink-950 py-8 sm:py-10" aria-label="Empresas del grupo">
    <div class="flex flex-col gap-3 sm:gap-4">
      <div v-for="row in 2" :key="row" class="flex w-max" aria-hidden="true">
        <div data-marquee-track class="gpu flex w-max">
          <ul v-for="copy in COPIES" :key="copy" class="flex shrink-0 items-center">
            <li
              v-for="company in COMPANIES"
              :key="`${row}-${copy}-${company.id}`"
              class="flex items-center gap-6 pr-6 sm:gap-10 sm:pr-10"
            >
              <span
                class="display text-fluid-3xl whitespace-nowrap"
                :class="
                  row === 1
                    ? company.featured
                      ? 'text-brand-500'
                      : 'text-paper'
                    : 'text-outline text-paper/35'
                "
              >
                {{ row === 1 ? company.name : company.category }}
              </span>
              <component :is="company.icon" class="size-6 shrink-0 text-brand-500 sm:size-8" :stroke-width="1.5" />
            </li>
          </ul>
        </div>
      </div>
    </div>
    <p class="sr-only">
      {{ COMPANIES.map((c) => `${c.name} (${c.category})`).join(', ') }}
    </p>
  </section>
</template>
